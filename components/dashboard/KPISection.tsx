import {
  IndianRupee,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { DashboardMetrics } from "@/lib/db/queries";

/**
 * Formats a number into Indian lakhs notation.
 * e.g. 1240290 → "₹12.4L"
 */
function formatLakhs(n: number): string {
  const lakhs = n / 100000;
  if (lakhs >= 10) return `₹${Math.round(lakhs)}L`;
  return `₹${lakhs.toFixed(1)}L`;
}

interface KPISectionProps {
  metrics: DashboardMetrics;
}

export function KPISection({ metrics }: KPISectionProps) {
  const successRateHealthy = metrics.successRate >= 95;
  const successRateWarning = metrics.successRate >= 90 && metrics.successRate < 95;

  const kpis = [
    {
      title: "Total Revenue",
      value: formatLakhs(metrics.totalRevenue),
      subtitle: `${metrics.totalPayments.toLocaleString("en-IN")} transactions`,
      trend: metrics.totalRevenue > 0 ? "Live" : "No data",
      trendUp: metrics.totalRevenue > 0,
      icon: IndianRupee,
      badge: metrics.totalRevenue > 0 ? "Healthy" : "No Data",
      badgeVariant: (metrics.totalRevenue > 0 ? "success" : "neutral") as
        | "success"
        | "neutral",
    },
    {
      title: "Payment Success Rate",
      value: `${metrics.successRate}%`,
      subtitle: "Target: 95.0%",
      trend: successRateHealthy
        ? "On Target"
        : `${(95 - metrics.successRate).toFixed(1)}% below`,
      trendUp: successRateHealthy,
      icon: CheckCircle2,
      badge: successRateHealthy
        ? "On Target"
        : successRateWarning
        ? "Below Benchmark"
        : "Critical",
      badgeVariant: (successRateHealthy
        ? "success"
        : successRateWarning
        ? "warning"
        : "error") as "success" | "warning" | "error",
    },
    {
      title: "Failed Payments",
      value: metrics.failedCount.toLocaleString("en-IN"),
      subtitle: `Out of ${metrics.totalPayments.toLocaleString("en-IN")} attempts`,
      trend:
        metrics.totalPayments > 0
          ? `${((metrics.failedCount / metrics.totalPayments) * 100).toFixed(1)}% fail rate`
          : "No data",
      trendUp: false,
      icon: XCircle,
      badge:
        metrics.failedCount > 50 ? "Investigation Needed" : "Within Range",
      badgeVariant: (metrics.failedCount > 50 ? "error" : "success") as
        | "error"
        | "success",
    },
    {
      title: "Revenue at Risk",
      value: formatLakhs(metrics.revenueAtRisk),
      subtitle: `${metrics.repeatFailureCustomers} repeat-fail customers`,
      trend: `${metrics.repeatFailureCustomers} Users`,
      trendUp: false,
      icon: AlertTriangle,
      badge:
        metrics.repeatFailureCustomers > 10
          ? "Action Required"
          : "Monitoring",
      badgeVariant: (metrics.repeatFailureCustomers > 10
        ? "warning"
        : "neutral") as "warning" | "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={kpi.title}
            className="relative overflow-hidden group hover:border-[#2C384F] transition-all bg-[#0D1017]"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-zinc-400">
                  {kpi.title}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-white font-mono">
                    {kpi.value}
                  </span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[#141A26] border border-[#20293D] text-zinc-300">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#182030] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                {kpi.trendUp ? (
                  <span className="flex items-center text-emerald-400 font-mono font-medium">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {kpi.trend}
                  </span>
                ) : (
                  <span className="flex items-center text-amber-400 font-mono font-medium">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    {kpi.trend}
                  </span>
                )}
                <span className="text-zinc-400 truncate max-w-[120px]">
                  {kpi.subtitle}
                </span>
              </div>
              <Badge variant={kpi.badgeVariant} size="sm">
                {kpi.badge}
              </Badge>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
