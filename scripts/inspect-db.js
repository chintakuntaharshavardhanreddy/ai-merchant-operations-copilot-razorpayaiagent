/* eslint-disable */
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const sb = createClient(url, key);

async function inspectAll() {
  console.log("Connecting to Supabase at:", url);
  const tables = [
    "merchants",
    "customers",
    "payments",
    "refunds",
    "support_cases",
    "agent_actions",
    "documents",
  ];

  for (const t of tables) {
    const { data, error } = await sb.from(t).select("*").limit(1);
    if (error) {
      console.log(`? Table '${t}': NOT FOUND or ERROR -> [${error.code}] ${error.message}`);
    } else {
      console.log(`? Table '${t}': EXISTS (rows accessible: ${data.length})`);
    }
  }

  // Check match_documents RPC
  const { data: rpcData, error: rpcError } = await sb.rpc("match_documents", {
    query_embedding: Array(3072).fill(0),
    match_threshold: 0.1,
    match_count: 1,
  });
  if (rpcError) {
    console.log(`? RPC 'match_documents': ERROR -> [${rpcError.code}] ${rpcError.message}`);
  } else {
    console.log(`? RPC 'match_documents': EXISTS`);
  }
}

inspectAll().catch(console.error);
