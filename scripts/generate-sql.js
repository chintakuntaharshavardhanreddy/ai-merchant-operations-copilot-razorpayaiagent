/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(1337);
function rand(min, max) { return Math.floor(rng() * (max - min + 1)) + min; }
function randElement(arr) { return arr[rand(0, arr.length - 1)]; }

const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Ananya', 'Diya', 'Aadhya', 'Saanvi', 'Pari', 'Avni', 'Kavya', 'Kiara', 'Isha', 'Mahi'];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Malhotra', 'Singh', 'Patel', 'Reddy', 'Kumar', 'Das', 'Bose', 'Mehta', 'Jain', 'Chopra', 'Kapoor', 'Agarwal'];
const domains = ['gmail.com', 'yahoo.in', 'hotmail.com'];

let sql = '-- AI Merchant Operations Copilot: Supabase Seed SQL\n';
sql += '-- Run schema.sql first, then run this file in Supabase SQL Editor.\n\n';
sql += 'BEGIN;\n\n';
sql += '-- 1. Clear existing records\n';
sql += 'TRUNCATE agent_actions, support_cases, refunds, payments, customers, merchants CASCADE;\n\n';

const merchantId = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
sql += '-- 2. Merchant\n';
sql += `INSERT INTO merchants (id, name, email) VALUES ('${merchantId}', 'Apex Retail Group', 'contact@apexretail.in');\n\n`;

sql += '-- 3. Customers (120)\n';
const customerIds = [];
for (let i = 1; i <= 120; i++) {
  const cId = 'c0000000-0000-0000-0000-' + String(i).padStart(12, '0');
  customerIds.push(cId);
  const first = randElement(firstNames);
  const last = randElement(lastNames);
  const email = `${first.toLowerCase()}.${last.toLowerCase()}${rand(10, 99)}@${randElement(domains)}`;
  sql += `INSERT INTO customers (id, name, email) VALUES ('${cId}', '${first} ${last}', '${email}');\n`;
}
sql += '\n';

const repeatCustomerIds = customerIds.slice(0, 28);

sql += '-- 4. Payments (550)\n';
const successPaymentIds = [];
const now = Date.now();
const payments = [];

for (let i = 1; i <= 550; i++) {
  const payId = 'pay_' + String(i).padStart(6, '0');
  const hoursAgo = rand(0, 7 * 24);
  const createdAt = new Date(now - hoursAgo * 3600 * 1000).toISOString();

  const r = rng();
  let method = 'UPI';
  if (r > 0.55 && r <= 0.80) method = 'CARD';
  else if (r > 0.80 && r <= 0.92) method = 'NETBANKING';
  else if (r > 0.92) method = 'WALLET';

  let amount = rand(99, 5000);
  let status = 'SUCCESS';
  let failureReason = null;

  // Pattern 1: UPI Anomaly (last 12 hours)
  if (method === 'UPI') {
    if (hoursAgo <= 12) {
      if (rng() < 0.25) {
        status = 'FAILED';
        failureReason = randElement(['TIMEOUT', 'NETWORK_ERROR', 'BANK_SERVER_DOWN']);
      }
    } else {
      if (rng() < 0.06) {
        status = 'FAILED';
        failureReason = randElement(['TIMEOUT', 'INSUFFICIENT_FUNDS']);
      }
    }
  } else {
    if (rng() < 0.05) {
      status = 'FAILED';
      failureReason = randElement(['AUTHENTICATION_FAILED', 'DECLINED_BY_BANK']);
    }
  }

  // Pattern 2: Repeat customer failures
  let customerId = randElement(customerIds);
  if (repeatCustomerIds.includes(customerId)) {
    status = 'FAILED';
    failureReason = randElement(['INSUFFICIENT_FUNDS', 'AUTHENTICATION_FAILED', 'LIMIT_EXCEEDED']);
  }

  // Pattern 3: High-value failed payments
  if (i >= 500 && i < 520) {
    status = 'FAILED';
    amount = rand(10000, 50000);
    method = randElement(['CARD', 'UPI']);
    failureReason = randElement(['LIMIT_EXCEEDED', 'RISK_REJECTED', 'DECLINED_BY_BANK']);
  }

  // Pattern 4: Revenue decline in recent 24h
  if (status === 'SUCCESS') {
    if (hoursAgo > 24 && hoursAgo <= 48) {
      amount = Math.floor(amount * 1.5);
    } else if (hoursAgo <= 24) {
      amount = Math.floor(amount * 0.6);
    }
    successPaymentIds.push({ id: payId, amount });
  }

  payments.push({ payId, customerId, amount, method, status, failureReason, createdAt });
}

for (const p of payments) {
  const reasonSql = p.failureReason ? `'${p.failureReason}'` : 'NULL';
  sql += `INSERT INTO payments (payment_id, merchant_id, customer_id, amount, currency, method, status, failure_reason, created_at) VALUES ('${p.payId}', '${merchantId}', '${p.customerId}', ${p.amount}, 'INR', '${p.method}', '${p.status}', ${reasonSql}, '${p.createdAt}');\n`;
}
sql += '\n';

sql += '-- 5. Refunds (55)\n';
const refundCandidates = successPaymentIds.slice(0, 55);
const refundReasons = ['Customer requested', 'Duplicate payment', 'Service not rendered', 'Defective product', 'Wrong amount charged'];
for (let i = 0; i < refundCandidates.length; i++) {
  const p = refundCandidates[i];
  const refStatus = randElement(['PROCESSED', 'PENDING']);
  const reason = randElement(refundReasons);
  sql += `INSERT INTO refunds (payment_id, amount, status, reason) VALUES ('${p.id}', ${p.amount}, '${refStatus}', '${reason}');\n`;
}
sql += '\n';

sql += '-- 6. Support Cases (12)\n';
const caseTitles = ['Payment stuck in pending', 'Refund not received', 'Double charged', 'Payment failed but money deducted', 'Cannot use UPI'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const caseStatuses = ['open', 'in_progress', 'resolved', 'closed'];
for (let i = 0; i < 12; i++) {
  const targetPay = randElement(successPaymentIds).id;
  const title = randElement(caseTitles);
  const prio = randElement(priorities);
  const st = randElement(caseStatuses);
  sql += `INSERT INTO support_cases (payment_id, title, description, priority, status) VALUES ('${targetPay}', '${title}', 'Customer opened inquiry regarding payment.', '${prio}', '${st}');\n`;
}
sql += '\n';

sql += 'COMMIT;\n';

fs.writeFileSync(path.join(__dirname, '../supabase/seed.sql'), sql);
console.log(`Successfully generated supabase/seed.sql with ${payments.length} payments, ${refundCandidates.length} refunds, 12 cases.`);
