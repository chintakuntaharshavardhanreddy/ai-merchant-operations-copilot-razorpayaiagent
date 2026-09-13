-- AI Merchant Operations Copilot — Database Schema
-- Run this in the Supabase SQL Editor to create all tables and indexes.

-- 1. Merchants
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT UNIQUE NOT NULL,
  merchant_id UUID REFERENCES merchants(id),
  customer_id UUID REFERENCES customers(id),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  method TEXT NOT NULL CHECK (method IN ('UPI', 'CARD', 'NETBANKING', 'WALLET')),
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING', 'REFUNDED')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Refunds
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PROCESSED', 'PENDING', 'FAILED')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Support Cases
CREATE TABLE IF NOT EXISTS support_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Agent Actions (Audit Log)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_merchant_id ON payments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_support_cases_payment_id ON support_cases(payment_id);
CREATE INDEX IF NOT EXISTS idx_support_cases_status ON support_cases(status);
CREATE INDEX IF NOT EXISTS idx_agent_actions_status ON agent_actions(status);
CREATE INDEX IF NOT EXISTS idx_agent_actions_created_at ON agent_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_actions_target_id ON agent_actions(target_id);

-- Row Level Security (enable for Supabase public access)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;

-- Policies — allow public read for demo (anon key)
CREATE POLICY "Allow public read merchants" ON merchants FOR SELECT USING (true);
CREATE POLICY "Allow public read customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow public read payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Allow public read refunds" ON refunds FOR SELECT USING (true);
CREATE POLICY "Allow public read support_cases" ON support_cases FOR SELECT USING (true);
CREATE POLICY "Allow public read agent_actions" ON agent_actions FOR SELECT USING (true);

-- Insert policies
CREATE POLICY "Allow public insert merchants" ON merchants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert refunds" ON refunds FOR INSERT WITH CHECK (true);
-- Direct public insert into support_cases is blocked; creation is restricted to server-side logic
-- Action proposals can only be inserted in unapproved pending status
CREATE POLICY "Allow server insert agent_actions" ON agent_actions FOR INSERT WITH CHECK (status = 'PENDING_APPROVAL' AND approved = false);
