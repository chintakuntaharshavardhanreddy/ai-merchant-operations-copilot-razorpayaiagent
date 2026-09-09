import { google } from "@ai-sdk/google";

/**
 * Gemini AI Agent Core (Architecture Foundation for Phase 2)
 *
 * This module configures Google Gemini as the core reasoning engine
 * for the AI Merchant Operations Copilot.
 *
 * Provider: Google Gemini (`@ai-sdk/google`)
 * Model: `gemini-1.5-pro` / `gemini-2.0-flash`
 */

export interface AgentExecutionContext {
  merchantId: string;
  userId?: string;
  sessionId: string;
}

export interface AgentExecutionTrace {
  step: string;
  tool?: string;
  status: "pending" | "running" | "completed" | "failed";
  durationMs?: number;
  outputSummary?: string;
}

/**
 * Returns configured Google Gemini model instance.
 * Ensures GEMINI_API_KEY is read strictly server-side.
 */
export function getGeminiModel(modelName: string = "gemini-1.5-pro") {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured in server environment variables. Please check .env"
    );
  }

  return google(modelName);
}
