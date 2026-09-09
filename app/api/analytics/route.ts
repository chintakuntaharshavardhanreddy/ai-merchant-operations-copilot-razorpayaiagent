import { NextResponse } from "next/server";

/**
 * Analytics API Route (Placeholder for Phase 2)
 *
 * Architecture:
 * - Aggregates payment volume, success rate, and failure categorization
 * - Queries PostgreSQL via Supabase client
 * - Exposes real-time velocity metrics for the dashboard
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "placeholder",
      phase: 2,
      message:
        "Analytics API endpoint ready for Supabase PostgreSQL metrics computation in Phase 2.",
      metricsSupported: [
        "total_revenue",
        "success_rate",
        "failure_breakdown_by_rail",
        "revenue_at_risk",
      ],
    },
    { status: 501 }
  );
}
