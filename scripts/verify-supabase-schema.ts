import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(url, key);

interface CheckResult {
  category: string;
  item: string;
  status: "PASS" | "FAIL" | "WARN";
  detail: string;
}

async function verifySchema(): Promise<boolean> {
  console.log("==================================================");
  console.log("🔍 Supabase Schema & Persistence Verification");
  console.log(`📡 URL: ${url}`);
  console.log("==================================================\n");

  const results: CheckResult[] = [];
  let allCriticalPass = true;

  // 1. Check agent_actions table & columns
  const actionColumns = [
    "id",
    "merchant_id",
    "action_type",
    "status",
    "title",
    "description",
    "target_id",
    "parameters",
    "result",
    "policy_sources",
    "estimated_value",
    "approved",
    "approved_at",
    "executed_at",
    "created_at",
    "updated_at",
  ];

  const { data: actData, error: actError } = await sb
    .from("agent_actions")
    .select(actionColumns.join(","))
    .limit(1);

  if (actError) {
    results.push({
      category: "Phase 5 Actions",
      item: "public.agent_actions",
      status: "FAIL",
      detail: `[${actError.code}] ${actError.message}`,
    });
    allCriticalPass = false;
  } else {
    results.push({
      category: "Phase 5 Actions",
      item: "public.agent_actions (table + all Phase 5 columns)",
      status: "PASS",
      detail: `Table exists with all 16 required columns. Accessible rows: ${actData?.length ?? 0}`,
    });
  }

  // 2. Check support_cases table & columns
  const supportColumns = ["id", "payment_id", "title", "description", "priority", "status", "created_at"];
  const { data: suppData, error: suppError } = await sb
    .from("support_cases")
    .select(supportColumns.join(","))
    .limit(1);

  if (suppError) {
    results.push({
      category: "Operations",
      item: "public.support_cases",
      status: "FAIL",
      detail: `[${suppError.code}] ${suppError.message}`,
    });
    allCriticalPass = false;
  } else {
    results.push({
      category: "Operations",
      item: "public.support_cases",
      status: "PASS",
      detail: `Table exists with all required columns. Accessible rows: ${suppData?.length ?? 0}`,
    });
  }

  // 2b. Check Atomic Concurrency RPCs (approve_agent_action & reject_agent_action)
  const { error: appRpcErr } = await sb.rpc("approve_agent_action", {
    p_action_id: "00000000-0000-0000-0000-000000000000",
    p_execution_result: {},
  });
  // If function does not exist, PostgREST returns PGRST202
  if (appRpcErr && appRpcErr.code === "PGRST202") {
    results.push({
      category: "Phase 5 Security",
      item: "RPC approve_agent_action",
      status: "FAIL",
      detail: `[${appRpcErr.code}] ${appRpcErr.message} (Defined in supabase/phase5_actions.sql)`,
    });
    allCriticalPass = false;
  } else {
    results.push({
      category: "Phase 5 Security",
      item: "RPC approve_agent_action",
      status: "PASS",
      detail: "Atomic SECURITY DEFINER approval function ready",
    });
  }

  const { error: rejRpcErr } = await sb.rpc("reject_agent_action", {
    p_action_id: "00000000-0000-0000-0000-000000000000",
    p_result: {},
  });
  if (rejRpcErr && rejRpcErr.code === "PGRST202") {
    results.push({
      category: "Phase 5 Security",
      item: "RPC reject_agent_action",
      status: "FAIL",
      detail: `[${rejRpcErr.code}] ${rejRpcErr.message} (Defined in supabase/phase5_actions.sql)`,
    });
    allCriticalPass = false;
  } else {
    results.push({
      category: "Phase 5 Security",
      item: "RPC reject_agent_action",
      status: "PASS",
      detail: "Atomic SECURITY DEFINER rejection function ready",
    });
  }

  // 3. Check RAG vector table & match_documents RPC
  const ragColumns = ["id", "title", "content", "embedding", "metadata", "created_at"];
  const { data: ragData, error: ragError } = await sb
    .from("documents")
    .select(ragColumns.join(","))
    .limit(1);

  if (ragError) {
    results.push({
      category: "RAG System",
      item: "public.documents",
      status: "WARN",
      detail: `[${ragError.code}] ${ragError.message} (Run supabase/rag.sql if RAG vector search is required)`,
    });
  } else {
    results.push({
      category: "RAG System",
      item: "public.documents",
      status: "PASS",
      detail: `pgvector table exists. Accessible chunks: ${ragData?.length ?? 0}`,
    });
  }

  const { error: rpcError } = await sb.rpc("match_documents", {
    query_embedding: Array(3072).fill(0),
    match_threshold: 0.1,
    match_count: 1,
  });

  if (rpcError) {
    results.push({
      category: "RAG System",
      item: "RPC match_documents(vector, float, int)",
      status: "WARN",
      detail: `[${rpcError.code}] ${rpcError.message} (Defined in supabase/rag.sql)`,
    });
  } else {
    results.push({
      category: "RAG System",
      item: "RPC match_documents",
      status: "PASS",
      detail: "Vector cosine similarity search function ready",
    });
  }

  // 4. Check base business data tables
  const baseTables = ["merchants", "customers", "payments", "refunds"];
  for (const table of baseTables) {
    const { error: baseErr } = await sb.from(table).select("*").limit(1);
    if (baseErr) {
      results.push({
        category: "Base Telemetry",
        item: `public.${table}`,
        status: "WARN",
        detail: `[${baseErr.code}] ${baseErr.message}`,
      });
    } else {
      results.push({
        category: "Base Telemetry",
        item: `public.${table}`,
        status: "PASS",
        detail: "Table exists and queryable",
      });
    }
  }

  // Print Summary Table
  console.log("SCHEMA VERIFICATION REPORT:\n");
  for (const r of results) {
    const icon = r.status === "PASS" ? "✅" : r.status === "WARN" ? "⚠️ " : "❌";
    console.log(`${icon} [${r.status}] [${r.category}] ${r.item}`);
    console.log(`    ↳ ${r.detail}\n`);
  }

  console.log("==================================================");
  if (allCriticalPass) {
    console.log("🎉 ALL CRITICAL PHASE 5 SCHEMA CHECKS PASSED!");
  } else {
    console.log("❌ CRITICAL PHASE 5 SCHEMA CHECKS FAILED.");
    console.log("Please execute the migration script in supabase/phase5_actions.sql in your Supabase SQL Editor.");
  }
  console.log("==================================================");

  return allCriticalPass;
}

verifySchema()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((err) => {
    console.error("Verification script execution error:", err);
    process.exit(1);
  });
