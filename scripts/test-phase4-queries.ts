import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { answerMerchantQuestion } from "../lib/ai/agent";

const TEST_QUESTIONS = [
  "Why did my revenue drop yesterday?",
  "Show me today's failed payments.",
  "Which customers have repeated payment failures?",
  "What is our refund policy?",
  "Why did revenue drop and what does our payment failure policy recommend?",
  "Find high-value failed payments above ?10,000.",
  "Which payment rail is currently performing worst?",
  "How many refunds are currently pending?",
];

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runAll() {
  console.log("==================================================");
  console.log("?? Testing Phase 4: Gemini Agent + Merchant Data Tools");
  console.log("==================================================\n");

  for (let i = 0; i < TEST_QUESTIONS.length; i++) {
    const q = TEST_QUESTIONS[i];
    console.log(`\n--------------------------------------------------`);
    console.log(`[Q${i + 1}/8] Question: "${q}"`);
    console.log(`--------------------------------------------------`);

    try {
      const startTime = Date.now();
      const res = await answerMerchantQuestion(q);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log(`?? Duration: ${elapsed}s`);
      console.log(`??? Tools Used: ${JSON.stringify(res.toolsUsed)}`);
      console.log(`?? RAG Sources: ${res.sources.length}`);
      console.log(`?? Execution Steps: ${res.executionTrace.length}`);
      console.log(`\n?? Agent Answer:\n${res.answer.slice(0, 300)}...\n`);
    } catch (err: unknown) {
      console.error(`? Error on Q${i + 1}:`, err instanceof Error ? err.message : err);
    }

    if (i < TEST_QUESTIONS.length - 1) {
      console.log("Waiting 2s cooldown...");
      await sleep(2000);
    }
  }

  console.log("\n==================================================");
  console.log("? All Phase 4 queries tested!");
  console.log("==================================================");
}

runAll().catch(console.error);
