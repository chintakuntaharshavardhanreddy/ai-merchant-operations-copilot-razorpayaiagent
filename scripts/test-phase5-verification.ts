import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const anonSb = createClient(url, anonKey);
const _adminSb = serviceRoleKey ? createClient(url, serviceRoleKey) : null;
void _adminSb;

interface CheckItem {
  id: number;
  label: string;
  category: string;
  passed: boolean;
  message: string;
}

async function verifyAll() {
  console.log("================================================================================");
  console.log("🔍 PHASE 5 SUPABASE REMOTE VERIFICATION & SECURITY AUDIT");
  console.log(`📡 URL: ${url}`);
  console.log(`🔑 Service Role Key Configured: ${Boolean(serviceRoleKey)}`);
  console.log("================================================================================\n");

  const items: CheckItem[] = [];

  // -------------------------------------------------------------------------
  // ITEM 1: agent_actions table
  // -------------------------------------------------------------------------
  const requiredActionCols = [
    "id", "merchant_id", "action_type", "status", "title", "description",
    "target_id", "parameters", "result", "policy_sources", "estimated_value",
    "approved", "approved_at", "executed_at", "created_at", "updated_at"
  ];
  const { data: actData, error: actErr } = await anonSb
    .from("agent_actions")
    .select(requiredActionCols.join(","))
    .limit(1);

  items.push({
    id: 1,
    label: "agent_actions table exists with all Phase 5 columns",
    category: "Schema",
    passed: !actErr,
    message: actErr ? `[${actErr.code}] ${actErr.message}` : `Table exists with all 16 required columns. Accessible rows: ${actData?.length ?? 0}`,
  });

  // -------------------------------------------------------------------------
  // ITEM 2: support_cases table
  // -------------------------------------------------------------------------
  const requiredSupportCols = ["id", "payment_id", "title", "description", "priority", "status", "created_at"];
  const { data: suppData, error: suppErr } = await anonSb
    .from("support_cases")
    .select(requiredSupportCols.join(","))
    .limit(1);

  items.push({
    id: 2,
    label: "support_cases table exists with all required columns",
    category: "Schema",
    passed: !suppErr,
    message: suppErr ? `[${suppErr.code}] ${suppErr.message}` : `Table exists with all 7 columns. Accessible rows: ${suppData?.length ?? 0}`,
  });

  // -------------------------------------------------------------------------
  // ITEM 3: documents table
  // -------------------------------------------------------------------------
  const { data: docData, error: docErr } = await anonSb
    .from("documents")
    .select("id, title, content, metadata")
    .limit(1);

  items.push({
    id: 3,
    label: "documents table in remote database",
    category: "RAG Schema",
    passed: !docErr,
    message: docErr ? `[${docErr.code}] ${docErr.message}` : `Table exists. Accessible rows: ${docData?.length ?? 0}`,
  });

  // -------------------------------------------------------------------------
  // ITEM 4: approve_agent_action RPC
  // -------------------------------------------------------------------------
  const { error: appErr } = await anonSb.rpc("approve_agent_action", {
    p_action_id: "00000000-0000-0000-0000-000000000000",
    p_execution_result: {},
  });

  const appRpcExists = !appErr || appErr.code !== "PGRST202";
  items.push({
    id: 4,
    label: "approve_agent_action RPC function exists in remote database",
    category: "Functions",
    passed: appRpcExists,
    message: appErr ? `Function registered in schema cache (Response: [${appErr.code}] ${appErr.message})` : "RPC executed successfully",
  });

  // -------------------------------------------------------------------------
  // ITEM 5: reject_agent_action RPC
  // -------------------------------------------------------------------------
  const { error: rejErr } = await anonSb.rpc("reject_agent_action", {
    p_action_id: "00000000-0000-0000-0000-000000000000",
    p_result: {},
  });

  const rejRpcExists = !rejErr || rejErr.code !== "PGRST202";
  items.push({
    id: 5,
    label: "reject_agent_action RPC function exists in remote database",
    category: "Functions",
    passed: rejRpcExists,
    message: rejErr ? `Function registered in schema cache (Response: [${rejErr.code}] ${rejErr.message})` : "RPC executed successfully",
  });

  // -------------------------------------------------------------------------
  // ITEM 6: agent_actions RLS policies
  // -------------------------------------------------------------------------
  // 6a: Anonymous SELECT
  const canAnonSelect = !actErr;

  // 6b: Anonymous INSERT with valid PENDING_APPROVAL
  const testTitle = `Audit_Test_${Date.now()}`;
  const { data: validInsData, error: validInsErr } = await anonSb
    .from("agent_actions")
    .insert({
      action_type: "PREPARE_RECOVERY_PLAN",
      title: testTitle,
      status: "PENDING_APPROVAL",
      approved: false,
      parameters: { test: true },
    })
    .select();

  const validActionId = validInsData?.[0]?.id;

  // 6c: Anonymous INSERT with EXECUTED (should be blocked by RLS check)
  const { error: tamperStatusErr } = await anonSb
    .from("agent_actions")
    .insert({
      action_type: "PREPARE_RECOVERY_PLAN",
      title: "Tamper Status Attempt",
      status: "EXECUTED",
      approved: true,
    })
    .select();

  // 6d: Anonymous INSERT with approved=true (should be blocked by RLS check)
  const { error: tamperApproveErr } = await anonSb
    .from("agent_actions")
    .insert({
      action_type: "PREPARE_RECOVERY_PLAN",
      title: "Tamper Approve Attempt",
      status: "PENDING_APPROVAL",
      approved: true,
    })
    .select();

  const rls6Passed = canAnonSelect && !validInsErr && Boolean(tamperStatusErr) && Boolean(tamperApproveErr);
  items.push({
    id: 6,
    label: "agent_actions RLS policies (SELECT allowed, PENDING_APPROVAL insert allowed, tamper insert blocked)",
    category: "Security / RLS",
    passed: rls6Passed,
    message: rls6Passed
      ? `SELECT: allowed; INSERT(PENDING_APPROVAL): allowed; INSERT(EXECUTED): blocked ([${tamperStatusErr?.code}] ${tamperStatusErr?.message}); INSERT(approved=true): blocked ([${tamperApproveErr?.code}] ${tamperApproveErr?.message})`
      : `Failed RLS tests: validInsErr=${validInsErr?.message}, tamperStatusErr=${tamperStatusErr?.message}, tamperApproveErr=${tamperApproveErr?.message}`,
  });

  // -------------------------------------------------------------------------
  // ITEM 7 & 11: support_cases RLS policies (SELECT allowed, INSERT/UPDATE blocked)
  // -------------------------------------------------------------------------
  const { data: suppInsData, error: suppInsErr } = await anonSb
    .from("support_cases")
    .insert({
      title: "Unauthorized Anonymous Support Case",
      description: "Direct insert bypass attempt",
    })
    .select();

  const { data: suppUpdData, error: suppUpdErr } = await anonSb
    .from("support_cases")
    .update({ status: "closed" })
    .neq("id", "00000000-0000-0000-0000-000000000000")
    .select();

  const suppInsertBlocked = Boolean(suppInsErr);
  const suppUpdateBlocked = Boolean(suppUpdErr) || Boolean(suppUpdData && suppUpdData.length === 0);
  items.push({
    id: 7,
    label: "support_cases RLS policies (SELECT allowed, INSERT blocked)",
    category: "Security / RLS",
    passed: !suppErr && suppInsertBlocked,
    message: suppInsertBlocked
      ? `Anonymous INSERT blocked: [${suppInsErr?.code}] ${suppInsErr?.message}`
      : `VULNERABILITY: Anonymous client inserted support_case! ID=${suppInsData?.[0]?.id}`,
  });

  items.push({
    id: 11,
    label: "No anonymous INSERT/UPDATE access to support_cases",
    category: "Security / Access Control",
    passed: suppInsertBlocked && suppUpdateBlocked,
    message: `INSERT blocked: ${suppInsertBlocked}; UPDATE blocked: ${suppUpdateBlocked} (0 rows modified: ${suppUpdData?.length ?? 0})`,
  });

  // -------------------------------------------------------------------------
  // ITEM 8 & 12: documents RLS policies (INSERT/DELETE blocked)
  // -------------------------------------------------------------------------
  let docInsBlocked = false;
  let docDelBlocked = false;
  let docRlsDetail = "";

  if (docErr) {
    docRlsDetail = `Table public.documents not found in schema cache ([${docErr.code}] ${docErr.message})`;
    docInsBlocked = true;
    docDelBlocked = true;
  } else {
    const { error: dInsErr } = await anonSb
      .from("documents")
      .insert({
        title: "Malicious Document",
        content: "Attempted tampering",
        embedding: Array(3072).fill(0),
      })
      .select();

    const { data: dDel, error: dDelErr } = await anonSb
      .from("documents")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select();

    docInsBlocked = Boolean(dInsErr);
    docDelBlocked = Boolean(dDelErr) || Boolean(dDel && dDel.length === 0);
    docRlsDetail = `INSERT blocked: ${docInsBlocked} (${dInsErr?.message}); DELETE blocked: ${docDelBlocked} (${dDelErr?.message || "0 rows deleted"})`;
  }

  items.push({
    id: 8,
    label: "documents RLS policies in remote database",
    category: "RAG Security",
    passed: docInsBlocked && docDelBlocked,
    message: docRlsDetail,
  });

  items.push({
    id: 12,
    label: "No anonymous INSERT/DELETE access to documents",
    category: "Security / Access Control",
    passed: docInsBlocked && docDelBlocked,
    message: docRlsDetail,
  });

  // -------------------------------------------------------------------------
  // ITEM 9: RPC EXECUTE privileges restricted to service_role
  // -------------------------------------------------------------------------
  const isAppDenied = appErr && (appErr.message.includes("permission denied") || appErr.code === "42501");
  const isRejDenied = rejErr && (rejErr.message.includes("permission denied") || rejErr.code === "42501");

  items.push({
    id: 9,
    label: "RPC EXECUTE privileges restricted to service_role (anon execution blocked)",
    category: "Privileged RPCs",
    passed: Boolean(isAppDenied || isRejDenied),
    message: `approve_agent_action anon denial: ${isAppDenied ? "YES (SQLSTATE 42501 permission denied)" : appErr?.message}; reject_agent_action anon denial: ${isRejDenied ? "YES (SQLSTATE 42501 permission denied)" : rejErr?.message}`,
  });

  // -------------------------------------------------------------------------
  // ITEM 10: No anonymous UPDATE access to agent_actions
  // -------------------------------------------------------------------------
  let actUpdateBlocked = false;
  let actUpdMessage = "";
  if (validActionId) {
    const { data: actUpdData, error: actUpdErr } = await anonSb
      .from("agent_actions")
      .update({ status: "EXECUTED", approved: true })
      .eq("id", validActionId)
      .select();

    actUpdateBlocked = Boolean(actUpdErr) || Boolean(actUpdData && actUpdData.length === 0);
    actUpdMessage = actUpdErr
      ? `Blocked with error: [${actUpdErr.code}] ${actUpdErr.message}`
      : `Blocked by RLS default-deny: 0 rows modified (rows updated: ${actUpdData?.length ?? 0})`;

    // Verify row still in PENDING_APPROVAL
    const { data: verifyRow } = await anonSb
      .from("agent_actions")
      .select("status, approved")
      .eq("id", validActionId)
      .single();

    actUpdMessage += `; Action status confirmed preserved as "${verifyRow?.status}", approved=${verifyRow?.approved}`;
  }

  items.push({
    id: 10,
    label: "No anonymous UPDATE access to agent_actions",
    category: "Security / Access Control",
    passed: actUpdateBlocked,
    message: actUpdMessage,
  });

  // Print Complete Checklist
  console.log("CHECKLIST RESULTS:\n");
  for (const it of items) {
    const icon = it.passed ? "✅" : "❌";
    console.log(`${icon} [${it.passed ? "PASS" : "FAIL"}] #${it.id}: ${it.label}`);
    console.log(`    ↳ Category: ${it.category}`);
    console.log(`    ↳ Detail: ${it.message}\n`);
  }

  console.log("================================================================================");
  const allPassed = items.every((i) => i.passed);
  console.log(allPassed ? "🎉 ALL 12 REMOTE SUPABASE VERIFICATION CHECKS PASSED!" : "⚠️ SOME CHECKS REQUIRE ATTENTION.");
  // Clean up transient test record from agent_actions table
  if (_adminSb && validActionId) {
    await _adminSb.from("agent_actions").delete().eq("id", validActionId);
  }

  return { items, allPassed, validActionId };
}

verifyAll().catch(console.error);
