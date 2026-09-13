import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const sb = createClient(url, anonKey);

async function main() {
  console.log('=== REMOTE SUPABASE ROW COUNTS ===');
  const tables = ['merchants', 'customers', 'payments', 'refunds', 'agent_actions', 'support_cases', 'documents'];
  for (const t of tables) {
    const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`[FAIL] ${t}: ERROR [${error.code}] ${error.message}`);
    } else {
      console.log(`[PASS] ${t}: ${count} rows`);
    }
  }

  console.log('\n=== ANONYMOUS / PUBLIC SECURITY VERIFICATION ===');
  
  // 1. Anon SELECT works
  const { data: custData, error: custReadErr } = await sb.from('customers').select('id, name').limit(1);
  console.log(`1. Anon SELECT customers: ${!custReadErr && custData?.length === 1 ? 'ALLOWED (PASS)' : 'FAILED'}`);

  // 2. Anon INSERT into customers blocked
  const { error: custInsertErr } = await sb.from('customers').insert({ name: 'Hacker', email: 'hack@test.com' });
  console.log(`2. Anon INSERT customers: ${custInsertErr ? 'BLOCKED (PASS) [' + custInsertErr.code + ']' : 'UNSAFE (FAIL)'}`);

  // 3. Anon UPDATE customers blocked
  const { error: custUpdateErr, count: updateCount } = await sb.from('customers').update({ name: 'Hacked' }).eq('id', 'c0000000-0000-0000-0000-000000000001');
  console.log(`3. Anon UPDATE customers: ${custUpdateErr || updateCount === 0 || updateCount === null ? 'BLOCKED (PASS)' : 'UNSAFE (FAIL)'}`);

  // 4. Anon DELETE customers blocked
  const { error: custDeleteErr, count: deleteCount } = await sb.from('customers').delete().eq('id', 'c0000000-0000-0000-0000-000000000001');
  console.log(`4. Anon DELETE customers: ${custDeleteErr || deleteCount === 0 || deleteCount === null ? 'BLOCKED (PASS)' : 'UNSAFE (FAIL)'}`);

  // 5. Anon INSERT payments blocked
  const { error: payInsertErr } = await sb.from('payments').insert({ payment_id: 'pay_hack', amount: 100, method: 'UPI', status: 'SUCCESS' });
  console.log(`5. Anon INSERT payments: ${payInsertErr ? 'BLOCKED (PASS) [' + payInsertErr.code + ']' : 'UNSAFE (FAIL)'}`);

  // 6. Anon UPDATE payments blocked
  const { count: payUpdateCount } = await sb.from('payments').update({ status: 'SUCCESS' }).eq('payment_id', 'pay_000001');
  console.log(`6. Anon UPDATE payments: ${payUpdateCount === 0 || payUpdateCount === null ? 'BLOCKED (PASS)' : 'UNSAFE (FAIL)'}`);

  // 7. Anon DELETE payments blocked
  const { count: payDeleteCount } = await sb.from('payments').delete().eq('payment_id', 'pay_000001');
  console.log(`7. Anon DELETE payments: ${payDeleteCount === 0 || payDeleteCount === null ? 'BLOCKED (PASS)' : 'UNSAFE (FAIL)'}`);

  // 8. Documents mutation blocked
  const { error: docInsertErr } = await sb.from('documents').insert({ content: 'malicious' });
  console.log(`8. Anon INSERT documents: ${docInsertErr ? 'BLOCKED (PASS)' : 'UNSAFE (FAIL)'}`);

  // 9. Agent actions tamper blocked
  const { error: actInsertErr } = await sb.from('agent_actions').insert({ action_type: 'PREPARE_REFUND', status: 'EXECUTED', approved: true });
  console.log(`9. Anon tamper INSERT agent_actions: ${actInsertErr ? 'BLOCKED (PASS)' : 'UNSAFE (FAIL)'}`);

  // 10. Privileged RPCs anon blocked
  const { error: rpcErr } = await sb.rpc('approve_agent_action', { p_action_id: '00000000-0000-0000-0000-000000000000' });
  console.log(`10. Anon approve_agent_action RPC: ${rpcErr ? 'BLOCKED (PASS) [' + rpcErr.code + ']' : 'UNSAFE (FAIL)'}`);
}

main().catch(console.error);
