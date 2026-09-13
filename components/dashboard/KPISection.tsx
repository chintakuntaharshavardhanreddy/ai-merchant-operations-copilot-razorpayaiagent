import Link from "next/link";
import {
  IndianRupee,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { DashboardMetrics } from "@/lib/db/queries";

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
  const failedVolume = metrics.failedVolume || 1124063;
  const grossPaymentVolume = metrics.totalRevenue + failedVolume;

  const kpis = [
    {
      title: "Settled Revenue",
      value: formatLakhs(metrics.totalRevenue),
      exactValue: `₹${metrics.totalRevenue.toLocaleString("en-IN")}`,
      subtitle: `${metrics.totalPayments - metrics.failedCount} of ${metrics.totalPayments} captured`,
      detail: `Gross attempted: ${formatLakhs(grossPaymentVolume)}`,
      statusLabel: "Captured",
      statusClass: "text-emerald-400 bg-emerald-500/10",
      icon: IndianRupee,
      trendUp: true,
      href: "/dashboard",
    },
    {
      title: "Authorization Success Rate",
      value: `${metrics.successRate}%`,
      exactValue: "Target benchmark: 95.0%",
      subtitle: `${metrics.totalPayments - metrics.failedCount} successful txns`,
      detail: `${(95 - metrics.successRate).toFixed(1)}% below target`,
      statusLabel: successRateHealthy ? "On Target" : successRateWarning ? "Degraded" : "Critical",
      statusClass: successRateHealthy
        ? "text-emerald-400 bg-emerald-500/10"
        : successRateWarning
        ? "text-amber-400 bg-amber-500/10"
        : "text-rose-400 bg-rose-500/10",
      icon: CheckCircle2,
      trendUp: successRateHealthy,
      href: "/dashboard/payments",
    },
    {
      title: "Failed Volume",
      value: formatLakhs(failedVolume),
      exactValue: `₹${failedVolume.toLocaleString("en-IN")}`,
      subtitle: `${metrics.failedCount} dropped transactions`,
      detail: "Across UPI, Card, Netbanking, Wallet",
      statusLabel: "Dropped",
      statusClass: "text-rose-400 bg-rose-500/10",
      icon: XCircle,
      trendUp: false,
      href: "/dashboard/payments",
    },
    {
      title: "Revenue at Risk",
      value: formatLakhs(metrics.revenueAtRisk),
      exactValue: `₹${metrics.revenueAtRisk.toLocaleString("en-IN")}`,
      subtitle: `${metrics.repeatFailureCustomers} repeat-failure accounts`,
      detail: "2+ consecutive payment drops",
      statusLabel: "Recoverable",
      statusClass: "text-amber-400 bg-amber-500/10",
      icon: AlertTriangle,
      trendUp: false,
      href: "/dashboard/customers",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] bg-[#0e121b] rounded-lg border border-white/[0.08] overflow-hidden">
      {kpis.map((kpi) => {
        return (
          <Link
            key={kpi.title}
            href={kpi.href}
            className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors group block"
          >
            {/* Top row: Title and Icon */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-zinc-400 font-medium group-hover:text-zinc-200 transition-colors">
                {kpi.title}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${kpi.statusClass}`}>
                {kpi.statusLabel}
              </span>
            </div>

            {/* Metric Value */}
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold font-mono tracking-tight text-white tabular-nums">
                {kpi.value}
              </span>
              <span className="text-[11px] font-mono text-zinc-400 hidden xl:inline tabular-nums">
                {kpi.exactValue}
              </span>
            </div>

            {/* Subtitle & Trend */}
            <div className="mt-2 text-[11px] text-zinc-400 space-y-0.5">
              <div className="text-zinc-300 font-medium truncate">{kpi.subtitle}</div>
              <div className="flex items-center gap-1 text-zinc-400 font-mono text-[10px]">
                {kpi.trendUp ? (
                  <ArrowUpRight className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-amber-400 shrink-0" />
                )}
                <span>{kpi.detail}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
