import { NextResponse } from "next/server";

/**
 * AI Chat Stream Endpoint (Placeholder for Phase 2)
 *
 * Architecture:
 * - Uses Google Gemini provider via `@ai-sdk/google`
 * - Integrates Gemini function calling with tools from `lib/ai/tools.ts`
 * - Streams responses back using `streamText()` from `ai`
 *
 * Requirements:
 * - GEMINI_API_KEY environment variable (server-side only)
 */
export async function POST() {
  return NextResponse.json(
    {
      status: "placeholder",
      phase: 2,
      message:
        "AI Chat API endpoint ready for Google Gemini integration. Real-time streaming and tool-calling will be connected in Phase 2.",
      provider: "google-gemini",
      configuredTools: [
        "get_payment",
        "search_payments",
        "search_knowledge_base",
        "prepare_recovery_action",
      ],
    },
    { status: 501 }
  );
}
