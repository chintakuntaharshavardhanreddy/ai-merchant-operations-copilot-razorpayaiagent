import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { searchKnowledgeBase } from "../lib/rag/search";

async function test() {
  console.log("Testing searchKnowledgeBase with query: 'What is our refund policy?'");
  const t0 = Date.now();
  const results = await searchKnowledgeBase("What is our refund policy?");
  const elapsed = Date.now() - t0;

  console.log(`\nSearch completed in ${elapsed}ms. Found ${results.length} matching chunks:`);
  for (const r of results) {
    console.log(`- [${r.similarity}] ${r.title} (Source: ${r.source})`);
  }
}

test().catch(console.error);
