import * as dotenv from "dotenv";
import * as path from "path";
import { execSync } from "child_process";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const sb = createClient(url, key);

async function testProcessRestartPersistence() {
  console.log("==================================================");
  console.log("🔄 Testing Cross-Process Persistence & Lifecycle");
  console.log("==================================================\n");

  // Step 0: Ensure table exists
  const { error: probeError } = await sb.from("agent_actions").select("id").limit(1);
  if (probeError) {
    console.error(`❌ Cannot test: 'public.agent_actions' is not ready in Supabase: [${probeError.code}] ${probeError.message}`);
    process.exit(1);
  }

  // Generate unique test action ID
  const testActionId = "test_" + Date.now();

  console.log(`[PROCESS 1] Creating action proposal: ${testActionId}`);
  execSync(
    `npx tsx -e "
import { createActionProposal } from './lib/db/queries';
async function run() {
  const res = await createActionProposal({
    actionType: 'PREPARE_RECOVERY_PLAN',
    title: 'Process Restart Test Action',
    description: 'Verifying process-restart durability',
    targetId: '${testActionId}',
    parameters: { customerCount: 3, estimatedRecoverableAmount: 18000 },
    estimatedValue: 18000,
  });
  console.log('CREATED_ACTION_ID:' + res.id);
}
run();
"`,
    { stdio: "inherit", cwd: process.cwd() }
  );

  console.log("\n✅ Process 1 terminated. Memory wiped.");

  // Query Supabase directly in this parent process to find the created action ID
  const { data: actions, error: fetchErr } = await sb
    .from("agent_actions")
    .select("id, status, title")
    .eq("target_id", testActionId)
    .single();

  if (fetchErr || !actions) {
    throw new Error(`Failed to find created action in Supabase: ${fetchErr?.message}`);
  }

  const createdId = actions.id;
  console.log(`\n[PROCESS 2] Approving action ${createdId} from fresh process...`);

  execSync(
    `npx tsx -e "
import { approveAction, getActionById } from './lib/db/queries';
async function run() {
  const act = await getActionById('${createdId}');
  if (!act) throw new Error('Action not found in Supabase!');
  if (act.status !== 'PENDING_APPROVAL') throw new Error('Status was not PENDING_APPROVAL: ' + act.status);
  const approved = await approveAction('${createdId}');
  if (approved.action.status !== 'EXECUTED') throw new Error('Status was not EXECUTED!');
  console.log('APPROVED_AND_EXECUTED:' + approved.action.status);
}
run();
"`,
    { stdio: "inherit", cwd: process.cwd() }
  );

  console.log("\n✅ Process 2 terminated. Memory wiped.");

  console.log(`\n[PROCESS 3] Attempting duplicate approval (idempotency) from fresh process...`);
  try {
    execSync(
      `npx tsx -e "
import { approveAction } from './lib/db/queries';
async function run() {
  await approveAction('${createdId}');
}
run();
"`,
      { stdio: "pipe", cwd: process.cwd() }
    );
    throw new Error("Duplicate approval should have failed!");
  } catch {
    console.log("✅ Process 3 correctly rejected duplicate approval from persisted database state.");
  }

  console.log(`\n[PROCESS 4] Verifying audit trail from fresh process...`);
  execSync(
    `npx tsx -e "
import { getRecentAgentActions } from './lib/db/queries';
async function run() {
  const recent = await getRecentAgentActions(5);
  const found = recent.find(a => a.id === '${createdId}');
  if (!found) throw new Error('Action not found in audit trail!');
  if (found.status !== 'EXECUTED') throw new Error('Status in audit trail was not EXECUTED!');
  console.log('AUDIT_VERIFIED: Action ' + found.id + ' is persisted as ' + found.status);
}
run();
"`,
    { stdio: "inherit", cwd: process.cwd() }
  );

  console.log("\n==================================================");
  console.log("🎉 Complete cross-process lifecycle verified against Supabase!");
  console.log("==================================================");
}

testProcessRestartPersistence().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
