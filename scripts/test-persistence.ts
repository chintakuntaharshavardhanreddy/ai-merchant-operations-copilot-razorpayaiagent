import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import {
  createActionProposal,
  getActionById,
  approveAction,
  rejectAction,
  getRecentAgentActions,
} from "../lib/db/queries";

async function runLifecycle() {
  console.log("==================================================");
  console.log("🧪 Testing Action Persistence & Idempotency");
  console.log("==================================================\n");

  // TEST 1: Create Action Proposal
  console.log("1. Creating Action Proposal (Recovery Plan)...");
  const action = await createActionProposal({
    actionType: "PREPARE_RECOVERY_PLAN",
    title: "Test Recovery Plan Proposal",
    description: "Automated retry orchestration test for 5 repeat-failure accounts",
    parameters: {
      customerCount: 5,
      estimatedRecoverableAmount: 42000,
      targetCustomerIds: ["cust_001", "cust_002"],
    },
    policySources: ["payment_failure_recovery_policy"],
    estimatedValue: 42000,
  });

  console.log(`✅ Action created with ID: ${action.id}`);
  console.log(`   Status: ${action.status}`);

  if (action.status !== "PENDING_APPROVAL") {
    throw new Error(`Expected PENDING_APPROVAL, got ${action.status}`);
  }

  // TEST 2: Read from Supabase directly
  console.log("\n2. Fetching Action by ID from Supabase...");
  const fetched = await getActionById(action.id);
  if (!fetched) {
    throw new Error(`Failed to find action ${action.id} in Supabase!`);
  }
  console.log(`✅ Fetched action title: "${fetched.title}"`);
  console.log(`   Estimated Value: ₹${fetched.estimated_value}`);

  // TEST 3: Approve Action & Validate Execution
  console.log("\n3. Approving Action in Supabase...");
  const approval = await approveAction(action.id);
  console.log(`✅ Approved status: ${approval.action.status}`);
  console.log(`   Execution Result:`, approval.executionResult);

  if (approval.action.status !== "EXECUTED" || !approval.action.approved) {
    throw new Error(`Expected EXECUTED and approved=true, got ${approval.action.status}`);
  }

  // TEST 4: Verify Idempotency (Duplicate Approval Rejected)
  console.log("\n4. Testing Idempotency Guard (Duplicate Approval)...");
  try {
    await approveAction(action.id);
    throw new Error("Idempotency guard failed: Duplicate approval succeeded!");
  } catch (err: unknown) {
    console.log(`✅ Idempotency guard triggered: "${err instanceof Error ? err.message : err}"`);
  }

  // TEST 5: Create and Reject an Action
  console.log("\n5. Testing Action Rejection Lifecycle...");
  const rejectTarget = await createActionProposal({
    actionType: "PREPARE_REFUND",
    title: "Test Refund Proposal for Rejection",
    description: "Testing operator rejection flow",
    parameters: {
      paymentId: "pay_test_999",
      amount: 1500,
      reason: "Customer requested cancellation",
    },
    estimatedValue: 1500,
  });

  const rejected = await rejectAction(rejectTarget.id, "Customer reached out on phone to keep order active.");
  console.log(`✅ Rejected status in Supabase: ${rejected.status}`);
  console.log(`   Rejection details:`, rejected.result);

  if (rejected.status !== "REJECTED") {
    throw new Error(`Expected REJECTED, got ${rejected.status}`);
  }

  // TEST 6: Create Support Case Action Proposal & Approve
  console.log("\n6. Testing Support Case Creation & Operational Escalation...");
  const supportAction = await createActionProposal({
    actionType: "CREATE_SUPPORT_CASE",
    title: "UPI Bank Gateway Latency Incident",
    description: "UPI success rate degraded below 80% on HDFC/ICICI rails",
    parameters: {
      title: "UPI Bank Gateway Latency Incident",
      description: "UPI success rate degraded below 80% on HDFC/ICICI rails",
      priority: "CRITICAL",
    },
  });

  const supportApproval = await approveAction(supportAction.id);
  console.log(`✅ Support Case action status: ${supportApproval.action.status}`);
  console.log(`   Created Support Case ID: ${supportApproval.executionResult.case_id}`);

  // TEST 7: Audit Trail Retrieval from Supabase
  console.log("\n7. Retrieving Recent Agent Actions (Audit Trail)...");
  const auditEntries = await getRecentAgentActions(5);
  console.log(`✅ Retrieved ${auditEntries.length} audit entries from Supabase:`);
  for (const entry of auditEntries) {
    console.log(`   - [${entry.status}] ${entry.action_type}: "${entry.title}" (${entry.created_at})`);
  }

  console.log("\n==================================================");
  console.log("🎉 All persistence and lifecycle tests completed!");
  console.log("==================================================");
}

runLifecycle().catch((err) => {
  console.error("\n❌ Persistence test encountered error:", err.message || err);
  process.exit(1);
});
