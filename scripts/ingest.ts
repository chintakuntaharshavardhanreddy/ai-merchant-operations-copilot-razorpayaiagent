import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { ingestKnowledgeBase } from "../lib/rag/ingest";

async function main() {
  const isReset = process.argv.includes("--reset");
  console.log("📚 Starting Merchant Knowledge Base Ingestion...");
  if (isReset) {
    console.log("🔄 Reset flag detected: Clearing previous documents in Supabase...");
  }

  const startTime = Date.now();
  const result = await ingestKnowledgeBase({ reset: isReset });
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n========================================`);
  console.log(`✅ Ingestion Complete in ${duration}s`);
  console.log(`📄 Knowledge Documents Processed: ${result.documentsProcessed}`);
  console.log(`🧩 Semantic Chunks Created: ${result.chunksIngested}`);
  console.log(`🗄️ Stored in Supabase pgvector: ${result.storedInSupabase ? "Yes" : "No (Cached Locally)"}`);

  if (result.errors.length > 0) {
    console.log(`\n⚠️ Notices/Warnings:`);
    for (const err of result.errors) {
      console.log(` - ${err}`);
    }
    if (!result.storedInSupabase) {
      console.log(`\n💡 Note: Run supabase/rag.sql in your Supabase SQL Editor to enable pgvector tables.`);
      console.log(`   Local vector cache was created at data/knowledge-indexed.json for instant search.`);
    }
  }
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error("❌ Ingestion script failed:", err);
  process.exit(1);
});
