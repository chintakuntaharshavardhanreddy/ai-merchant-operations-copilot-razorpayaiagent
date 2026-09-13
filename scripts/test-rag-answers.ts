import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { answerMerchantQuestion } from "../lib/ai/agent";

const questions = [
  "What is our refund policy?",
  "What should I do when a payment fails after authorization?",
  "What happens during settlement?",
  "How should I handle a customer dispute?",
  "What should support do when a customer reports a failed payment?",
  // Negative test: Should not invent transaction metrics
  "Why did my revenue drop yesterday?"
];

async function runTests() {
  console.log("🚀 Testing Grounded Gemini RAG Q&A on 6 Questions...\n");

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`-------------------------------------------------------------------`);
    console.log(`Q${i + 1}: "${q}"`);
    console.log(`-------------------------------------------------------------------`);

    const t0 = Date.now();
    const res = await answerMerchantQuestion(q);
    const duration = Date.now() - t0;

    console.log(`⏱️ Duration: ${duration}ms`);
    console.log(`📚 Sources Cited (${res.sources.length}):`, res.sources.map(s => `${s.title} (${s.source})`).join(", ") || "None");
    console.log(`\n💬 Answer:\n${res.answer}\n`);
  }
}

runTests().catch(console.error);
