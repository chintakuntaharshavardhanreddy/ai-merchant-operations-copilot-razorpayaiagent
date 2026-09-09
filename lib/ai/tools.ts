/**
 * Agent Tool Declarations (Architecture Foundation for Phase 2)
 *
 * Defines the tool signatures and schemas for Gemini function calling.
 * These will be wired to PostgreSQL / Supabase and RAG vector search in Phase 2.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export const COPILOT_TOOLS: ToolDefinition[] = [
  {
    name: "get_payment",
    description: "Fetch comprehensive transaction telemetry by payment ID (status, method, gateway code, customer ID, logs)",
    parameters: {
      type: "object",
      properties: {
        paymentId: {
          type: "string",
          description: "Unique payment identifier (e.g. pay_94827492)",
        },
      },
      required: ["paymentId"],
    },
  },
  {
    name: "search_payments",
    description: "Search and filter payment transactions by timeframe, status (failed, captured, refunded), method (upi, card, netbanking), and gateway error code",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["failed", "captured", "refunded", "authorized"],
        },
        method: {
          type: "string",
          enum: ["upi", "card", "netbanking", "wallet"],
        },
        timeframe: {
          type: "string",
          description: "Relative or ISO date window (e.g. 'today', '24h', '7d')",
        },
        limit: {
          type: "number",
          description: "Maximum number of transactions to return",
        },
      },
    },
  },
  {
    name: "search_knowledge_base",
    description: "Semantic RAG similarity search over merchant operational documentation, settlement policies, refund playbooks, and gateway troubleshooting manuals",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural language query regarding policies or operational procedures",
        },
        category: {
          type: "string",
          description: "Optional category filter: 'refunds', 'failures', 'settlements', 'disputes'",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "prepare_recovery_action",
    description: "Construct an actionable recovery proposal for failed customer checkouts to present to the human operator for approval",
    parameters: {
      type: "object",
      properties: {
        customerCount: {
          type: "number",
          description: "Count of affected customers to target",
        },
        actionType: {
          type: "string",
          enum: ["whatsapp_payment_link", "email_retry_prompt", "switch_gateway_routing"],
        },
        potentialRevenue: {
          type: "number",
          description: "Estimated gross value recoverable",
        },
      },
      required: ["customerCount", "actionType"],
    },
  },
];
