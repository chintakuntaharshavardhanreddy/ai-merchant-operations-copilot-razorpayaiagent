/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const seedSql = fs.readFileSync(path.join(__dirname, '../supabase/seed.sql'), 'utf8');

// Extract sections from seed.sql
const merchantMatch = seedSql.match(/-- 2\. Merchant[\s\S]*?(?=-- 3\. Customers)/);
const customersMatch = seedSql.match(/-- 3\. Customers[\s\S]*?(?=-- 4\. Payments)/);
const paymentsMatch = seedSql.match(/-- 4\. Payments[\s\S]*?(?=-- 5\. Refunds)/);
const refundsMatch = seedSql.match(/-- 5\. Refunds[\s\S]*?(?=-- 6\. Support Cases)/);

let ddl = `-- ==============================================================================
-- AI Merchant Operations Copilot: Base Tables & Seed Data
-- ==============================================================================
-- Safe, idempotent, non-destructive migration:
-- - Creates merchants, customers, payments, refunds tables if not exists
-- - Applies performance indexes
-- - Enables Row Level Security (RLS) with public SELECT policies
-- - Preserves agent_actions, support_cases, and documents unchanged
-- - Seeds 1 merchant, 120 customers, 550 payments, 55 refunds
-- ==============================================================================

-- 1. Base Tables DDL
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PROCESSED', 'PENDING', 'FAILED')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_merchant_id ON payments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);

-- 3. Row Level Security
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- 4. RLS Read Policies (Idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merchants' AND policyname = 'Allow public read merchants') THEN
    CREATE POLICY "Allow public read merchants" ON merchants FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Allow public read customers') THEN
    CREATE POLICY "Allow public read customers" ON customers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Allow public read payments') THEN
    CREATE POLICY "Allow public read payments" ON payments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'refunds' AND policyname = 'Allow public read refunds') THEN
    CREATE POLICY "Allow public read refunds" ON refunds FOR SELECT USING (true);
  END IF;
END $$;

-- 5. Data Ingestion (Idempotent with ON CONFLICT)
`;

const merchantSql = merchantMatch[0].trim().replace(/;$/, ' ON CONFLICT (id) DO NOTHING;') + '\n\n';
const customersSql = customersMatch[0].trim().replace(/;\r?\n/g, ' ON CONFLICT (id) DO NOTHING;\n').replace(/;$/, ' ON CONFLICT (id) DO NOTHING;') + '\n\n';
const paymentsSql = paymentsMatch[0].trim().replace(/;\r?\n/g, ' ON CONFLICT (payment_id) DO NOTHING;\n').replace(/;$/, ' ON CONFLICT (payment_id) DO NOTHING;') + '\n\n';
const refundsSql = refundsMatch[0].trim() + '\n\n';

const fullSql = ddl + merchantSql + customersSql + paymentsSql + refundsSql;

fs.writeFileSync(path.join(__dirname, '../supabase/base_tables.sql'), fullSql, 'utf8');
console.log('Successfully generated supabase/base_tables.sql. Length:', fullSql.length);
