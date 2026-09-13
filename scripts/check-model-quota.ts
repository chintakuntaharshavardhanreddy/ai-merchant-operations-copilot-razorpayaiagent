import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function check() {
  const models = ["gemini-flash-lite-latest", "gemini-pro-latest", "gemini-2.5-pro", "gemini-flash-latest"];
  for (const m of models) {
    try {
      const t0 = Date.now();
      const res = await generateText({
        model: google(m),
        prompt: "Say: Ready",
      });
      console.log(`✅ Model ${m} SUCCEEDED in ${Date.now() - t0}ms: ${res.text.trim()}`);
      return m;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`❌ Model ${m} failed: ${msg.slice(0, 150)}`);
    }
  }
}

check().catch(console.error);
