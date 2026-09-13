import { tool } from "ai";
import { z } from "zod";
import {
  getDashboardMetrics,
  getRevenueTrend,
  getPaymentHealth,
  searchPayments,
  analyzeFailedPayments,
  findRepeatedFailureCustomers,
  getRefundAnalytics,
  createActionProposal,
  searchPayments as dbSearchPayments,
  AgentActionRecord,
} from "../db/queries";
import { searchKnowledgeBase } from "../rag/search";

export interface ToolCallLog {
  toolName: string;
  args: Record<string, unknown>;
  timestamp: number;
  durationMs: number;
  success: boolean;
  summary: string;
}

/**
 * Creates the read-only suite of merchant operational intelligence tools for Gemini.
 * Accepts an optional callback to log tool invocations for the execution trace.
 */
export function createMerchantTools(
  onToolCall?: (log: ToolCallLog) => void,
  onActionProposed?: (action: AgentActionRecord) => void
) {
  return {
    // ----------------------------------------------------
    // TOOL 1: get_dashboard_metrics
    // ----------------------------------------------------
    get_dashboard_metrics: tool({
      description:
        "Retrieve high-level merchant KPI metrics including gross revenue, payment success rate, failed count, total transactions, revenue at risk, and count of repeat-failure customers.",
      inputSchema: z.object({}),
      execute: async () => {
        const t0 = Date.now();
        const metrics = await getDashboardMetrics();
        onToolCall?.({
          toolName: "get_dashboard_metrics",
          args: {},
          timestamp: t0,
          durationMs: Date.now() - t0,
          success: true,
          summary: `Revenue: ?${(metrics.totalRevenue / 100000).toFixed(1)}L, Success Rate: ${metrics.successRate}%, Failures: ${metrics.failedCount}`,
        });
        return metrics;
      },
    }),

    // ----------------------------------------------------
    // TOOL 2: get_revenue_trend
    // ----------------------------------------------------
    get_revenue_trend: tool({
      description:
        "Retrieve revenue velocity and performance across 24h operational windows. Compares the last 24h settled revenue and failed volume against the prior 24h period.",
      inputSchema: z.object({}),
      execute: async () => {
        const t0 = Date.now();
        const trend = await getRevenueTrend();
        onToolCall?.({
          toolName: "get_revenue_trend",
          args: {},
          timestamp: t0,
          durationMs: Date.now() - t0,
          success: true,
          summary: `Last 24h: ?${(trend.last24hRevenue / 100000).toFixed(1)}L vs Prior 24h: ?${(trend.prior24hRevenue / 100000).toFixed(1)}L (${trend.percentageChange}%)`,
        });
        return trend;
      },
    }),

    // ----------------------------------------------------
    // TOOL 3: get_payment_health
    // ----------------------------------------------------
    get_payment_health: tool({
      description:
        "Retrieve rail-by-rail operational health metrics for UPI, Cards, Netbanking, and Wallets. Returns total volume, success rate, failure counts, share of volume, and top failure reasons.",
      inputSchema: z.object({}),
      execute: async () => {
        const t0 = Date.now();
        const health = await getPaymentHealth();
        onToolCall?.({
          toolName: "get_payment_health",
          args: {},
          timestamp: t0,
          durationMs: Date.now() - t0,
          success: true,
          summary: `Evaluated ${health.length} rails (${health.map((h) => `${h.method}: ${h.successRate}%`).join(", ")})`,
        });
        return health;
      },
    }),

    // ----------------------------------------------------
    // TOOL 4: search_payments
    // ----------------------------------------------------
    search_payments: tool({
      description:
        "Search and filter individual payment transactions using structured criteria. Never returns unrestricted dumps; limits results to max 25 records.",
      inputSchema: z.object({
        status: z
          .enum(["SUCCESS", "FAILED", "PENDING", "REFUNDED"])
          .optional()
          .describe("Filter by transaction status"),
        method: z
          .enum(["UPI", "CARD", "NETBANKING", "WALLET"])
          .optional()
          .describe("Filter by payment rail"),
        failure_reason: z
          .string()
          .optional()
          .describe("Filter by failure code or message (e.g. TIMEOUT, INSUFFICIENT_FUNDS, LIMIT_EXCEEDED)"),
        min_amount: z.number().optional().describe("Minimum payment amount in INR"),
        max_amount: z.number().optional().describe("Maximum payment amount in INR"),
        time_range: z
          .enum(["today", "24h", "7d", "all"])
          .optional()
          .describe("Time window to filter"),
        customer_id: z.string().optional().describe("Specific customer ID"),
        payment_id: z.string().optional().describe("Exact payment ID (e.g. pay_000001)"),
        limit: z.number().optional().describe("Max number of records to return (1-25)"),
      }),
      execute: async (filters) => {
        const t0 = Date.now();
        const payments = await searchPayments(filters);
        onToolCall?.({
          toolName: "search_payments",
          args: filters,
          timestamp: t0,
          durationMs: Date.now() - t0,
          success: true,
          summary: `Found ${payments.length} matching transactions`,
        });
        return payments;
      },
    }),

    // ----------------------------------------------------
    // TOOL 5: analyze_failed_payments
    // ----------------------------------------------------
    analyze_failed_payments: tool({
      description:
        "Perform deep analytical diagnostic on failed payments. Returns total failed volume, percentage breakdown by failure reason, payment method distribution, high-value failed payments (>= ?10,000), and recent 12h failure velocity trends.",
      inputSchema: z.object({
        method: z
          .enum(["UPI", "CARD", "NETBANKING", "WALLET"])
          .optional()
          .describe("Optional rail filter"),
        time_range: z
          .enum(["today", "24h", "7d", "all"])
          .optional()
          .describe("Optional time range"),
      }),
      execute: async (options) => {
        const t0 = Date.now();
        const analysis = await analyzeFailedPayments(options);
        onToolCall?.({
          toolName: "analyze_failed_payments",
          args: options || {},
          timestamp: t0,
          durationMs: Date.now() - t0,
          success: true,
          summary: `${analysis.totalFailedCount} failures (?${analysis.totalFailedAmount.toLocaleString("en-IN")}), ${analysis.highValueFailedPayments.length} high-value drops`,
        });
        return analysis;
      },
    }),

    // ----------------------------------------------------
    // TOOL 6: find_repeated_failure_customers
    // ----------------------------------------------------
    find_repeated_failure_customers: tool({
      description:
        "Identify high-intent customers experiencing multiple consecutive payment authorization failures. Returns masked customer emails, failure counts, total failed amount, dominant failure reason, and last failure timestamp.",
      inputSchema: z.object({
        min_failures: z
          .number()
          .optional()
          .describe("Minimum number of failed transactions per customer (default 2)"),
        limit: z
          .number()
          .optional()
          .describe("Maximum number of customers to return (default 10)"),
      }),
      execute: async (options) => {
        const t0 = Date.now();
        const customers = await findRepeatedFailureCustomers(options);
        onToolCall?.({
          toolName: "find_repeated_failure_customers",
          args: options || {},
          timestamp: t0,
          durationMs: Date.now() - t0,
          success: true,
          summary: `Found ${customers.length} customers with repeat failures`,
        });
        return customers;
      },
    }),

    // ----------------------------------------------------
    // TOOL 7: get_refund_analytics
    // ----------------------------------------------------
    get_refund_analytics: tool({
      description:
        "Retrieve comprehensive refund analytics. Returns total refund amount, processed vs. pending counts and amounts, and breakdown by customer refund reason.",
      inputSchema: z.object({}),
      execute: async () => {
        const t0 = Date.now();
        const refunds = await getRefundAnalytics();
        onToolCall?.({
          toolName: "get_refund_analytics",
          args: {},
          timestamp: t0,
          durationMs: Date.now() - t0,
          success: true,
          summary: `${refunds.totalRefundCount} refunds (?${refunds.totalRefundAmount.toLocaleString("en-IN")}), ${refunds.pendingRefundsCount} pending`,
        });
        return refunds;
      },
    }),

    // ----------------------------------------------------
    // TOOL 8: search_merchant_knowledge
    // ----------------------------------------------------
    search_merchant_knowledge: tool({
      description:
        "Semantic RAG search over authoritative merchant operations policy documents: refund SLA guidelines, settlement schedules, chargeback and dispute playbooks, payment failure classification matrices, and customer recovery SOPs.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("Natural language query regarding merchant policies, turnaround times, or dispute rules"),
        limit: z
          .number()
          .optional()
          .describe("Number of document chunks to retrieve (default 4)"),
      }),
      execute: async ({ query, limit }) => {
        const t0 = Date.now();
        const results = await searchKnowledgeBase(query, { limit: limit || 4 });
        onToolCall?.({
          toolName: "search_merchant_knowledge",
          args: { query, limit },
          timestamp: t0,
          durationMs: Date.now() - t0,
          success: true,
          summary: `Retrieved ${results.length} chunks (${results.map((r) => r.source).join(", ")})`,
        });
        return results.map((r) => ({
          title: r.title,
          content: r.content,
          similarity: r.similarity,
          source: r.source,
        }));
      },
    }),

    // ====================================================
    // ===== PHASE 5: CONTROLLED ACTION PROPOSAL TOOLS =====
    // ====================================================

    // ----------------------------------------------------
    // ACTION TOOL 1: prepare_recovery_plan
    // ----------------------------------------------------
    prepare_recovery_plan: tool({
      description:
        "Prepare a structured recovery plan proposal for customers experiencing repeated payment failures. This does NOT contact customers automatically. It creates a PENDING_APPROVAL action proposal requiring explicit merchant authorization.",
      inputSchema: z.object({
        customer_count: z
          .number()
          .describe("Number of affected high-intent customers identified for recovery"),
        estimated_recoverable_amount: z
          .number()
          .describe("Total recoverable revenue amount in INR"),
        recommended_channel: z
          .string()
          .default("WhatsApp / SMS with 15-minute validity recovery link")
          .describe("Recommended customer recovery communication channel"),
        reason: z
          .string()
          .describe("Operational justification and failure patterns observed"),
        target_customer_ids: z
          .array(z.string())
          .optional()
          .describe("List of target customer identifiers or masked emails"),
      }),
      execute: async ({
        customer_count,
        estimated_recoverable_amount,
        recommended_channel,
        reason,
        target_customer_ids,
      }) => {
        const t0 = Date.now();
        const action = await createActionProposal({
          actionType: "PREPARE_RECOVERY_PLAN",
          title: `Prepare recovery plan for ${customer_count} customers`,
          description: reason,
          targetId: target_customer_ids?.join(", ") || `${customer_count} customers`,
          parameters: {
            customerCount: customer_count,
            estimatedRecoverableAmount: estimated_recoverable_amount,
            recommendedChannel: recommended_channel,
            targetCustomerIds: target_customer_ids || [],
            reason,
          },
          policySources: ["Merchant Support Standard Operating Procedures (SOP)"],
          estimatedValue: estimated_recoverable_amount,
        });

        onActionProposed?.(action);
        onToolCall?.({
          toolName: "prepare_recovery_plan",
          args: { customer_count, estimated_recoverable_amount, reason },
          timestamp: t0,
          durationMs: Date.now() - t0,
          success: true,
          summary: `Proposed recovery plan: ${customer_count} customers (?${estimated_recoverable_amount.toLocaleString("en-IN")}) - PENDING APPROVAL`,
        });

        return {
          status: "PENDING_APPROVAL",
          action_id: action.id,
          title: action.title,
          description: action.description,
          estimated_recoverable_amount,
          policy_basis: "Merchant Support SOP � 2 (Customer Recovery Workflow)",
          requires_human_approval: true,
          notice: "Action proposal created. Awaiting merchant operator approval before execution.",
        };
      },
    }),

    // ----------------------------------------------------
    // ACTION TOOL 2: prepare_support_case
    // ----------------------------------------------------
    prepare_support_case: tool({
      description:
        "Prepare an operational support ticket proposal for an escalated payment rail degradation or gateway failure. This does NOT finalize the case automatically. It creates a PENDING_APPROVAL action proposal requiring explicit merchant authorization.",
      inputSchema: z.object({
        title: z.string().describe("Clear, descriptive title for the support ticket"),
        description: z
          .string()
          .describe("Detailed technical description including failure codes, affected volume, and timestamps"),
        priority: z
          .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
          .describe("Ticket urgency priority"),
        payment_id: z
          .string()
          .optional()
          .describe("Specific payment ID or rail pattern identifier (e.g. UPI-TIMEOUT-DEGRADATION)"),
      }),
      execute: async ({ title, description, priority, payment_id }) => {
        const t0 = Date.now();
        const action = await createActionProposal({
          actionType: "CREATE_SUPPORT_CASE",
          title: title,
          description: description,
          targetId: payment_id || "OPERATIONAL_INCIDENT",
          parameters: {
            title,
            description,
            priority,
            paymentId: payment_id || null,
          },
          policySources: ["Merchant Support Standard Operating Procedures (SOP)"],
          estimatedValue: 0,
        });

        onActionProposed?.(action);
        onToolCall?.({
          toolName: "prepare_support_case",
          args: { title, priority, payment_id },
          timestamp: t0,
          durationMs: Date.now() - t0,
          success: true,
          summary: `Proposed support case: "${title}" (${priority}) - PENDING APPROVAL`,
        });

        return {
          status: "PENDING_APPROVAL",
          action_id: action.id,
          title,
          priority,
          target_id: payment_id || null,
          requires_human_approval: true,
          notice: "Support case proposal created. Awaiting merchant operator approval before ticket creation.",
        };
      },
    }),

    // ----------------------------------------------------
    // ACTION TOOL 3: prepare_refund
    // ----------------------------------------------------
    prepare_refund: tool({
      description:
        "Prepare a refund proposal for a specific payment. Verifies payment existence and policy eligibility first. This does NOT execute the refund or transfer funds. It creates a PENDING_APPROVAL action proposal requiring explicit merchant authorization.",
      inputSchema: z.object({
        payment_id: z.string().describe("Exact transaction ID to refund (e.g. pay_000001)"),
        amount: z.number().describe("Refund amount in INR"),
        reason: z
          .string()
          .describe("Reason for refund (e.g. duplicate charge, customer cancellation, service SLA failure)"),
        policy_basis: z
          .string()
          .describe("Reference to internal refund policy SLA or guidelines"),
      }),
      execute: async ({ payment_id, amount, reason, policy_basis }) => {
        const t0 = Date.now();

        // 1. Verify payment exists
        const payments = await dbSearchPayments({ payment_id });
        const payment = payments.find((p) => p.payment_id === payment_id);

        if (!payment) {
          throw new Error(`Payment transaction "${payment_id}" not found in merchant telemetry.`);
        }

        const action = await createActionProposal({
          actionType: "PREPARE_REFUND",
          title: `Prepare refund for payment ${payment_id} (?${amount.toLocaleString("en-IN")})`,
          description: `Refund request: ?${amount.toLocaleString("en-IN")} for payment ${payment_id}. Reason: ${reason}. Policy basis: ${policy_basis}`,
          targetId: payment_id,
          parameters: {
            paymentId: payment_id,
            amount,
            reason,
            policyBasis: policy_basis,
            paymentMethod: payment.method,
            paymentStatus: payment.status,
          },
          policySources: [policy_basis, "Merchant Refund Policy & SLA Guidelines"],
          estimatedValue: amount,
        });

        onActionProposed?.(action);
        onToolCall?.({
          toolName: "prepare_refund",
          args: { payment_id, amount, reason },
          timestamp: t0,
          durationMs: Date.now() - t0,
          success: true,
          summary: `Proposed refund: ${payment_id} (?${amount.toLocaleString("en-IN")}) - PENDING APPROVAL`,
        });

        return {
          status: "PENDING_APPROVAL",
          action_id: action.id,
          payment_id,
          amount_inr: amount,
          payment_method: payment.method,
          reason,
          policy_basis,
          requires_human_approval: true,
          notice: "Refund proposal prepared in DEMO environment. Awaiting merchant operator approval. NO funds have been transferred.",
        };
      },
    }),
  };
}
