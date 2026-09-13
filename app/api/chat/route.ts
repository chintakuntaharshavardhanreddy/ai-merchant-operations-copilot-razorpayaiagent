import { NextRequest, NextResponse } from "next/server";
import { runMerchantAgent } from "@/lib/ai/agent";
import { chatRateLimiter } from "@/lib/api/rate-limit";

/**
 * POST /api/chat
 *
 * Grounded RAG + Agent Chat API for AI Merchant Operations Copilot.
 * Queries merchant knowledge base and telemetry tools, injects context into Google Gemini,
 * prepares controlled action proposals, and returns grounded answers with source citations,
 * execution trace, and action proposals.
 */
export async function POST(request: NextRequest) {
  // Rate limiting: 10 requests/minute per IP
  const rateLimitResponse = chatRateLimiter.check(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "Invalid request. 'message' string is required." },
        { status: 400 }
      );
    }

    const message = body.message.trim();
    if (!message) {
      return NextResponse.json(
        { error: "Message cannot be empty." },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message exceeds maximum allowed length (2000 characters)." },
        { status: 400 }
      );
    }

    const response = await runMerchantAgent(message);

    return NextResponse.json({
      answer: response.answer,
      sources: response.sources,
      executionTrace: response.executionTrace,
      toolsUsed: response.toolsUsed,
      actionProposal: response.actionProposal,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[/api/chat] Error generating Copilot response:", msg);

    return NextResponse.json(
      {
        error: "Failed to generate operational response. Please try again.",
        answer: "A service error occurred while processing your request. Please check server logs.",
        sources: [],
        toolsUsed: [],
        actionProposal: null,
        executionTrace: [
          {
            step: "Request processing error",
            detail: "Server encountered an internal exception",
            time: "0ms",
            completed: false,
            error: true,
          },
        ],
      },
      { status: 500 }
    );
  }
}
