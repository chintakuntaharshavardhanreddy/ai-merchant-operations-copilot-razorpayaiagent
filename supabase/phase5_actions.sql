-- AI Merchant Operations Copilot — Phase 5: Production Action & Audit Log Migration
-- Safe, additive, non-destructive migration.
-- Works whether executed on a fresh Supabase database or an existing Phase 2 database.

-- 1. Ensure support_cases table exists (from Phase 2 / Phase 5 operational escalation)
CREATE TABLE IF NOT EXISTS support_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ensure base agent_actions table exists
CREATE TABLE IF NOT EXISTS agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXECUTED', 'FAILED')),
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  target_id TEXT,
  parameters JSONB DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  policy_sources TEXT[] DEFAULT ARRAY[]::TEXT[],
  estimated_value NUMERIC(12,2) DEFAULT 0,
  approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Safely add missing Phase 5 columns to agent_actions if table already existed from Phase 2
ALTER TABLE agent_actions 
  ADD COLUMN IF NOT EXISTS merchant_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXECUTED', 'FAILED')),
  ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS target_id TEXT,
  ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS result JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS policy_sources TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4. Create indexes for high-performance status filtering and audit queries
CREATE INDEX IF NOT EXISTS idx_agent_actions_status ON agent_actions(status);
CREATE INDEX IF NOT EXISTS idx_agent_actions_created_at ON agent_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_actions_target_id ON agent_actions(target_id);
CREATE INDEX IF NOT EXISTS idx_support_cases_payment_id ON support_cases(payment_id);
CREATE INDEX IF NOT EXISTS idx_support_cases_status ON support_cases(status);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_cases ENABLE ROW LEVEL SECURITY;

-- 6. Configure Hardened Production RLS Policies
-- Security Boundaries:
-- - Public/client users can read the demo audit trail and support cases.
-- - Action proposals may be created only in PENDING_APPROVAL status.
-- - Direct public/anon UPDATE on agent_actions is strictly FORBIDDEN (no UPDATE policy).
-- - Direct public/anon INSERT and UPDATE on support_cases is strictly FORBIDDEN.
-- - Consequential state transitions are enforced through SECURITY DEFINER RPCs.

DO $$ 
BEGIN
  -- Drop overly-permissive legacy policies if they exist
  DROP POLICY IF EXISTS "Allow public update agent_actions" ON agent_actions;
  DROP POLICY IF EXISTS "Allow public insert support_cases" ON support_cases;
  DROP POLICY IF EXISTS "Allow public update support_cases" ON support_cases;

  -- agent_actions SELECT: public read for audit trail
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_actions' AND policyname = 'Allow public read agent_actions') THEN
    CREATE POLICY "Allow public read agent_actions" ON agent_actions FOR SELECT USING (true);
  END IF;

  -- agent_actions INSERT: only allowed in PENDING_APPROVAL status (cannot insert pre-executed actions)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_actions' AND policyname = 'Allow server insert agent_actions') THEN
    CREATE POLICY "Allow server insert agent_actions" ON agent_actions 
      FOR INSERT 
      WITH CHECK (status = 'PENDING_APPROVAL' AND approved = false);
  END IF;

  -- support_cases SELECT: public read for operations display
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_cases' AND policyname = 'Allow public read support_cases') THEN
    CREATE POLICY "Allow public read support_cases" ON support_cases FOR SELECT USING (true);
  END IF;
END $$;

-- 7. Atomic Concurrency-Safe State Transition RPCs (SECURITY DEFINER)
-- Enforces: PENDING_APPROVAL -> EXECUTED with exactly-one-row enforcement.
-- Also atomically inserts associated support_cases within the same transaction.

CREATE OR REPLACE FUNCTION approve_agent_action (
  p_action_id UUID,
  p_execution_result JSONB,
  p_support_case JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action agent_actions%ROWTYPE;
  v_case_id UUID;
BEGIN
  -- 1. Atomic conditional update: only transitions if status is currently PENDING_APPROVAL
  UPDATE agent_actions
  SET
    status = 'EXECUTED',
    approved = true,
    approved_at = now(),
    executed_at = now(),
    result = p_execution_result,
    updated_at = now()
  WHERE id = p_action_id
    AND status = 'PENDING_APPROVAL'
  RETURNING * INTO v_action;

  -- 2. Concurrency check: verify exactly one row was updated
  IF NOT FOUND THEN
    SELECT * INTO v_action FROM agent_actions WHERE id = p_action_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'ACTION_NOT_FOUND: Action proposal % not found.', p_action_id;
    ELSE
      RAISE EXCEPTION 'ACTION_ALREADY_RESOLVED: Action proposal % has already been resolved with status "%". Duplicate approval blocked.', p_action_id, v_action.status;
    END IF;
  END IF;

  -- 3. If a support case payload is attached (for CREATE_SUPPORT_CASE), insert atomically
  IF p_support_case IS NOT NULL AND (p_support_case->>'title') IS NOT NULL THEN
    v_case_id := COALESCE((p_support_case->>'id')::UUID, gen_random_uuid());
    INSERT INTO support_cases (
      id,
      payment_id,
      title,
      description,
      priority,
      status,
      created_at
    ) VALUES (
      v_case_id,
      p_support_case->>'payment_id',
      p_support_case->>'title',
      COALESCE(p_support_case->>'description', ''),
      COALESCE(p_support_case->>'priority', 'HIGH'),
      COALESCE(p_support_case->>'status', 'open'),
      now()
    );
  END IF;

  RETURN to_jsonb(v_action);
END;
$$;

-- Atomic Concurrency-Safe Rejection RPC (SECURITY DEFINER)
-- Enforces: PENDING_APPROVAL -> REJECTED with exactly-one-row enforcement.
CREATE OR REPLACE FUNCTION reject_agent_action (
  p_action_id UUID,
  p_result JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action agent_actions%ROWTYPE;
BEGIN
  UPDATE agent_actions
  SET
    status = 'REJECTED',
    approved = false,
    result = p_result,
    updated_at = now()
  WHERE id = p_action_id
    AND status = 'PENDING_APPROVAL'
  RETURNING * INTO v_action;

  IF NOT FOUND THEN
    SELECT * INTO v_action FROM agent_actions WHERE id = p_action_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'ACTION_NOT_FOUND: Action proposal % not found.', p_action_id;
    ELSE
      RAISE EXCEPTION 'ACTION_ALREADY_RESOLVED: Action proposal % has already been resolved with status "%". Rejection blocked.', p_action_id, v_action.status;
    END IF;
  END IF;

  RETURN to_jsonb(v_action);
END;
$$;

-- 8. Privileged RPC Access Control
-- REVOKE EXECUTE from PUBLIC, anon, and authenticated roles so client-side browsers
-- cannot invoke these privileged functions directly via PostgREST RPC (/rest/v1/rpc/...).
-- GRANT EXECUTE exclusively to service_role so only server-side handlers can execute them.
REVOKE EXECUTE ON FUNCTION approve_agent_action(UUID, JSONB, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION approve_agent_action(UUID, JSONB, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION reject_agent_action(UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION reject_agent_action(UUID, JSONB) TO service_role;
