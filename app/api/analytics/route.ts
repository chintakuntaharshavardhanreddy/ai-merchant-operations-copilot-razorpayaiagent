import { NextRequest, NextResponse } from "next/server";
import {
  getDashboardMetrics,
  getRevenueOverTime,
  getPaymentHealth,
  getPaymentStatistics,
  getRefundMetrics,
  getOperationalSignals,
} from "@/lib/db/queries";
import { analyticsRateLimiter } from "@/lib/api/rate-limit";

/**
 * GET /api/analytics
 *
 * Returns dashboard analytics computed from Supabase PostgreSQL.
 * Does not expose sensitive customer information.
 */
export async function GET(request: NextRequest) {
  // Rate limiting: 30 requests/minute per IP
  const rateLimitResponse = analyticsRateLimiter.check(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const [metrics, revenue, paymentHealth, statistics, refunds, signals] =
      await Promise.all([
        getDashboardMetrics(),
        getRevenueOverTime(),
        getPaymentHealth(),
        getPaymentStatistics(),
        getRefundMetrics(),
        getOperationalSignals(),
      ]);

    return NextResponse.json({
      metrics,
      revenue,
      paymentHealth,
      statistics,
      refunds,
      signals,
    });
  } catch (error) {
    console.error("[/api/analytics] Error fetching analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch analytics data",
        metrics: {
          totalRevenue: 0,
          successRate: 0,
          failedCount: 0,
          totalPayments: 0,
          revenueAtRisk: 0,
          repeatFailureCustomers: 0,
        },
        revenue: [],
        paymentHealth: [],
        statistics: { avgTicketSize: 0, totalTransactions: 0, successTransactions: 0 },
        refunds: { totalRefunds: 0, totalRefundAmount: 0, pendingRefunds: 0 },
        signals: [],
      },
      { status: 500 }
    );
  }
}
