import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mulberry32 PRNG for deterministic random values
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}
const rng = mulberry32(1337);

function rand(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randElement<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)];
}

const indianFirstNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Ananya", "Diya", "Aadhya", "Saanvi", "Pari", "Avni", "Kavya", "Kiara", "Isha", "Mahi"];
const indianLastNames = ["Sharma", "Verma", "Gupta", "Malhotra", "Singh", "Patel", "Reddy", "Kumar", "Das", "Bose", "Mehta", "Jain", "Chopra", "Kapoor", "Agarwal"];

function generateEmail(first: string, last: string) {
  const domains = ['gmail.com', 'yahoo.in', 'hotmail.com'];
  return `${first.toLowerCase()}.${last.toLowerCase()}${rand(10, 99)}@${randElement(domains)}`;
}

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Clear existing data
  await supabase.from('agent_actions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('support_cases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('refunds').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('merchants').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 2. Create Merchant
  const { data: merchantData, error: merchantError } = await supabase
    .from('merchants')
    .insert({ name: 'Apex Retail Group', email: 'contact@apexretail.in' })
    .select()
    .single();

  if (merchantError || !merchantData) {
    console.error('Failed to create merchant:', merchantError);
    return;
  }
  const merchantId = merchantData.id;
  console.log('✅ Created Merchant');

  // 3. Create Customers
  const customers = [];
  for (let i = 0; i < 120; i++) {
    const first = randElement(indianFirstNames);
    const last = randElement(indianLastNames);
    customers.push({
      name: `${first} ${last}`,
      email: generateEmail(first, last)
    });
  }

  const { data: createdCustomers, error: custError } = await supabase
    .from('customers')
    .insert(customers)
    .select();

  if (custError || !createdCustomers) {
    console.error('Failed to create customers:', custError);
    return;
  }
  console.log(`✅ Created ${createdCustomers.length} Customers`);

  // Choose 25-30 customers for repeated failures
  const repeatedFailureCustomers = createdCustomers.slice(0, 28).map(c => c.id);

  // 4. Create Payments
  const payments = [];
  const now = new Date();
  
  for (let i = 0; i < 550; i++) {
    // Distribute time over last 7 days
    const hoursAgo = rand(0, 7 * 24);
    const createdAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    
    // Payment method distribution: UPI ~55%, CARD ~25%, NETBANKING ~12%, WALLET ~8%
    const r = rng();
    let method = 'UPI';
    if (r > 0.55 && r <= 0.80) method = 'CARD';
    else if (r > 0.80 && r <= 0.92) method = 'NETBANKING';
    else if (r > 0.92) method = 'WALLET';

    let amount = rand(99, 5000); // default amount

    let status = 'SUCCESS';
    let failure_reason = null;

    // PATTERN 1: UPI Anomaly (last 12 hours)
    if (method === 'UPI') {
      if (hoursAgo <= 12) {
        if (rng() < 0.25) {
          status = 'FAILED';
          failure_reason = randElement(['TIMEOUT', 'NETWORK_ERROR', 'BANK_SERVER_DOWN']);
        }
      } else {
        if (rng() < 0.06) {
          status = 'FAILED';
          failure_reason = randElement(['TIMEOUT', 'INSUFFICIENT_FUNDS']);
        }
      }
    } else {
      // Other methods normal failure rates (~5%)
      if (rng() < 0.05) {
        status = 'FAILED';
        failure_reason = randElement(['AUTHENTICATION_FAILED', 'DECLINED_BY_BANK']);
      }
    }

    // Assign customer
    const customerId = randElement(createdCustomers).id;

    // PATTERN 2: Repeated Payment Failures
    if (repeatedFailureCustomers.includes(customerId)) {
      status = 'FAILED';
      failure_reason = randElement(['INSUFFICIENT_FUNDS', 'AUTHENTICATION_FAILED', 'LIMIT_EXCEEDED']);
    }

    // PATTERN 3: High-Value Failed Payments (overwrite for ~15-20 payments)
    if (i >= 500 && i < 520) {
      status = 'FAILED';
      amount = rand(10000, 50000);
      method = randElement(['CARD', 'UPI']);
      failure_reason = randElement(['LIMIT_EXCEEDED', 'RISK_REJECTED', 'DECLINED_BY_BANK']);
    }

    // Payment ID deterministic
    const paymentIdStr = `pay_${String(i + 1).padStart(6, '0')}`;

    payments.push({
      payment_id: paymentIdStr,
      merchant_id: merchantId,
      customer_id: customerId,
      amount: amount,
      currency: 'INR',
      method: method,
      status: status,
      failure_reason: failure_reason,
      created_at: createdAt.toISOString()
    });
  }

  // PATTERN 4: Revenue Decline (adjust volumes based on time)
  // Instead of deleting, let's artificially cluster more high value successes in the prior period
  for (const p of payments) {
    const hoursAgo = (now.getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60);
    if (p.status === 'SUCCESS') {
      if (hoursAgo > 24 && hoursAgo <= 48) {
        // Boost amount in previous 24h
        p.amount = Math.floor(p.amount * 1.5);
      } else if (hoursAgo <= 24) {
        // Lower amount in recent 24h
        p.amount = Math.floor(p.amount * 0.6);
      }
    }
  }

  // Insert payments in batches
  const successfulPayments = [];
  for (let i = 0; i < payments.length; i += 100) {
    const batch = payments.slice(i, i + 100);
    const { data: createdPayments, error: payError } = await supabase
      .from('payments')
      .insert(batch)
      .select();
    
    if (payError) {
      console.error('Failed to create payments batch:', payError);
      return;
    }
    successfulPayments.push(...createdPayments);
  }
  console.log(`✅ Created ${payments.length} Payments`);

  // PATTERN 5: Refunds
  const refundCandidates = successfulPayments.filter(p => p.status === 'SUCCESS').slice(0, 55);
  const refunds = refundCandidates.map(p => {
    return {
      payment_id: p.payment_id,
      amount: p.amount,
      status: randElement(['PROCESSED', 'PENDING']),
      reason: randElement(['Customer requested', 'Duplicate payment', 'Service not rendered', 'Defective product', 'Wrong amount charged']),
      created_at: new Date(new Date(p.created_at).getTime() + rand(1, 24) * 60 * 60 * 1000).toISOString()
    }
  });

  if (refunds.length > 0) {
    const { error: refundError } = await supabase.from('refunds').insert(refunds);
    if (refundError) console.error('Failed to create refunds:', refundError);
    else console.log(`✅ Created ${refunds.length} Refunds`);
  }

  // 6. Support Cases
  const supportCases = [];
  for (let i = 0; i < 12; i++) {
    supportCases.push({
      payment_id: randElement(successfulPayments).payment_id,
      title: randElement(['Payment stuck in pending', 'Refund not received', 'Double charged', 'Payment failed but money deducted', 'Cannot use UPI']),
      description: 'Customer is inquiring about an issue with their transaction.',
      priority: randElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      status: randElement(['open', 'in_progress', 'resolved', 'closed']),
    });
  }

  const { error: supportError } = await supabase.from('support_cases').insert(supportCases);
  if (supportError) console.error('Failed to create support cases:', supportError);
  else console.log(`✅ Created ${supportCases.length} Support Cases`);

  console.log('✅ Seed complete!');
}

main().catch(console.error);
