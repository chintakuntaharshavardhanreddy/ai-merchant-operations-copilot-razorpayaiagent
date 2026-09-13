import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { answerMerchantQuestion } from "../lib/ai/agent";

async function test() {
  const res = await answerMerchantQuestion("What is our refund policy?");
  console.log("Trace:", JSON.stringify(res.executionTrace, null, 2));
  console.log("Answer:", res.answer);
}

test().catch(console.error);
