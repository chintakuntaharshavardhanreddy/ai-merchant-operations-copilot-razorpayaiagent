import { NextRequest, NextResponse } from "next/server";
import {
  approveAction,
  rejectAction,
  getActionById,
  getRecentAgentActions,
  ActionType,
} from "@/lib/db/queries";
import { actionsRateLimiter } from "@/lib/api/rate-limit";

const ALLOWED_ACTIONS: ActionType[] = [
  "PREPARE_RECOVERY_PLAN",
  "CREATE_SUPPORT_CASE",
  "PREPARE_REFUND",
];

/**
 * GET /api/actions
 * Returns recent agent actions for audit trail and dashboard.
 */
export async function GET(request: NextRequest) {
  // Rate limiting: 20 requests/minute per IP
  const rateLimitResponse = actionsRateLimiter.check(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);

    const actions = await getRecentAgentActions(limit);
    return NextResponse.json({ actions });
  } catch (error: unknown) {
    console.error("[/api/actions GET] Error fetching actions:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to retrieve action history." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/actions
 * Handles human approval, rejection, or inspection of agentic action proposals.
 * Enforces strict server-side validation:
 * - Action must exist
 * - Action must be in PENDING_APPROVAL status
 * - Action type must be allowlisted
 * - Prevents duplicate execution
 */
export async function POST(request: NextRequest) {
  // Rate limiting: 20 requests/minute per IP
  const rateLimitResponse = actionsRateLimiter.check(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload. JSON object expected." },
        { status: 400 }
      );
    }

    const { operation, actionId, reason } = body as {
      operation?: string;
      actionId?: string;
      reason?: string;
    };

    if (!actionId || typeof actionId !== "string") {
      return NextResponse.json(
        { error: "Missing required 'actionId' string parameter." },
        { status: 400 }
      );
    }

    if (!operation || !["approve", "reject"].includes(operation)) {
      return NextResponse.json(
        { error: "Invalid operation. Must be 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    // 1. Fetch action from database
    const action = await getActionById(actionId);
    if (!action) {
      return NextResponse.json(
        { error: `Action proposal with ID "${actionId}" not found.` },
        { status: 404 }
      );
    }

    // 2. Validate action type is allowed
    if (!ALLOWED_ACTIONS.includes(action.action_type)) {
      return NextResponse.json(
        { error: `Action type "${action.action_type}" is not authorized for execution.` },
        { status: 403 }
      );
    }

    // 3. Enforce idempotency: must be PENDING_APPROVAL
    if (action.status !== "PENDING_APPROVAL") {
      return NextResponse.json(
        {
          error: `Action "${actionId}" has already been resolved with status "${action.status}". Cannot ${operation} again.`,
          currentStatus: action.status,
          action,
        },
        { status: 400 }
      );
    }

    // 4. Execute operation
    if (operation === "approve") {
      const approvalResult = await approveAction(actionId);
      return NextResponse.json({
        success: true,
        operation: "approve",
        action: approvalResult.action,
        result: approvalResult.executionResult,
        message: approvalResult.message,
      });
    } else {
      const rejectedAction = await rejectAction(actionId, reason);
      return NextResponse.json({
        success: true,
        operation: "reject",
        action: rejectedAction,
        message: `Action "${action.title}" was rejected. Recommendation archived.`,
      });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[/api/actions POST] Error processing action authorization:", msg);

    return NextResponse.json(
      { error: "Failed to process action authorization. Please try again." },
      { status: 500 }
    );
  }
}
