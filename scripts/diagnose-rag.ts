import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { getSupabaseClient } from "../lib/db/client";
import { generateGeminiEmbedding } from "../lib/rag/embeddings";

async function diagnose() {
  console.log("=== PHASE 3 RAG DIAGNOSTIC ===");

  // Check 1: Env variables
  console.log("\n[1] Environment Variables:");
  console.log(" - GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
  console.log(" - NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log(" - NEXT_PUBLIC_SUPABASE_ANON_KEY present:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // Check 2: Gemini Embedding Call
  console.log("\n[2] Testing Gemini Embedding API...");
  const t0 = Date.now();
  try {
    const emb = await Promise.race([
      generateGeminiEmbedding("What is our refund policy?"),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Gemini embedding TIMED OUT after 10s")), 10000))
    ]);
    console.log(` ✅ Gemini Embedding SUCCESS in ${Date.now() - t0}ms, dimension: ${emb.length}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(` ❌ Gemini Embedding FAILED: ${msg}`);
  }

  // Check 3: Supabase Connection & Table Check
  console.log("\n[3] Testing Supabase documents table...");
  const sb = getSupabaseClient();
  if (!sb) {
    console.log(" ❌ Supabase client is null");
  } else {
    try {
      const t1 = Date.now();
      const res = await Promise.race([
        sb.from("documents").select("id, title").limit(1),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Supabase query TIMED OUT after 5s")), 5000))
      ]);
      if (res.error) {
        console.log(` ⚠️ Supabase documents table error in ${Date.now() - t1}ms:`, res.error.message);
      } else {
        console.log(` ✅ Supabase documents table EXISTS, rows found: ${res.data?.length}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(` ❌ Supabase query FAILED: ${msg}`);
    }

    // Check 4: match_documents RPC check
    console.log("\n[4] Testing Supabase match_documents RPC...");
    try {
      const dummyVec = new Array(3072).fill(0.01);
      const t2 = Date.now();
      const rpcRes = await Promise.race([
        sb.rpc("match_documents", {
          query_embedding: dummyVec,
          match_threshold: 0.1,
          match_count: 1
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Supabase RPC TIMED OUT after 5s")), 5000))
      ]);
      if (rpcRes.error) {
        console.log(` ⚠️ Supabase RPC error in ${Date.now() - t2}ms:`, rpcRes.error.message);
      } else {
        console.log(` ✅ Supabase match_documents RPC EXISTS and returned in ${Date.now() - t2}ms`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(` ❌ Supabase RPC FAILED: ${msg}`);
    }
  }

  // Check 5: Local indexed cache check
  console.log("\n[5] Checking local knowledge cache...");
  const fs = await import("fs");
  const cachePath = path.resolve(process.cwd(), "data/knowledge-indexed.json");
  if (fs.existsSync(cachePath)) {
    const data = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    console.log(` ✅ Local cache exists with ${data.length} chunks`);
  } else {
    console.log(" ⚠️ Local cache does NOT exist");
  }

  console.log("\n=== DIAGNOSTIC COMPLETE ===");
}

diagnose().catch(console.error);
