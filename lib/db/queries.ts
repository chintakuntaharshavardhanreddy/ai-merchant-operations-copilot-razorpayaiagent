/**
 * Database Query Contracts (Architecture Foundation for Phase 2)
 *
 * Defines TypeScript interfaces and query signatures for fetching
 * payment transactions, failure logs, and analytics aggregations from PostgreSQL.
 */

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: "captured" | "failed" | "refunded" | "pending";
  method: "upi" | "card" | "netbanking" | "wallet";
  customerEmail: string;
  errorCode?: string;
  errorDescription?: string;
  gateway: string;
  createdAt: string;
}

export interface MetricSummary {
  totalRevenue: number;
  successRate: number;
  failedCount: number;
  revenueAtRisk: number;
}

export interface AuditActionRecord {
  id: string;
  actionType: string;
  targetCount: number;
  potentialRevenue: number;
  approvedBy: string;
  status: "approved" | "rejected" | "executed";
  timestamp: string;
}

/**
 * Placeholder signatures to be wired to Supabase in Phase 2
 */
export async function fetchPayments(filters?: {
  status?: string;
  method?: string;
  limit?: number;
}): Promise<PaymentRecord[]> {
  void filters;
  return [];
}

export async function fetchDailyMetrics(): Promise<MetricSummary> {
  return {
    totalRevenue: 1240290,
    successRate: 94.2,
    failedCount: 312,
    revenueAtRisk: 184200,
  };
}

export async function logApprovedAction(
  action: Omit<AuditActionRecord, "id" | "timestamp">
): Promise<boolean> {
  void action;
  return true;
}
