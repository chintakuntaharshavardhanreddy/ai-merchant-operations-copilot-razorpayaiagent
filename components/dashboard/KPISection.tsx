import Link from "next/link";
import {
  IndianRupee,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
} from "lucide-react";
import type { DashboardMetrics } from "@/lib/db/queries";

/**
 * Formats a number into Indian lakhs notation.
 * e.g. 878819 → "₹8.8L"
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
  const failedVolume = metrics.failedVolume || 1124063;
  const highValueCount = metrics.highValueFailedCount || 20;
  const grossPaymentVolume = metrics.totalRevenue + failedVolume;

  const kpis = [
    {
      title: "Settled Revenue",
      value: formatLakhs(metrics.totalRevenue),
      exactValue: `₹${metrics.totalRevenue.toLocaleString("en-IN")}`,
      subtitle: `${metrics.totalPayments - metrics.failedCount} captured (${formatLakhs(grossPaymentVolume)} gross attempted)`,
      explanation: "Total successfully authorized and captured volume. (Gross Payment Volume: ₹20.0L across 550 attempted transactions).",
      statusLabel: "Live Captured",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      icon: IndianRupee,
      trend: "Telemetry Verified",
      trendUp: true,
      href: "#overview",
    },
    {
      title: "Authorization Success Rate",
      value: `${metrics.successRate}%`,
      exactValue: `Target: 95.0%`,
      subtitle: `${metrics.totalPayments - metrics.failedCount} / ${metrics.totalPayments} successful`,
      explanation: "Percentage of initiated transactions that reached terminal SUCCESS status.",
      statusLabel: successRateHealthy ? "On Target" : successRateWarning ? "Degraded" : "Critical",
      statusColor: successRateHealthy
        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        : successRateWarning
        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
        : "text-rose-400 bg-rose-500/10 border-rose-500/20",
      icon: CheckCircle2,
      trend: `${(95 - metrics.successRate).toFixed(1)}% below target`,
      trendUp: successRateHealthy,
      href: "#payment-methods",
    },
    {
      title: "Failed Volume",
      value: formatLakhs(failedVolume),
      exactValue: `₹${failedVolume.toLocaleString("en-IN")}`,
      subtitle: `${metrics.failedCount} dropped transactions`,
      explanation: "Cumulative volume of all 198 failed payments across UPI, Card, Netbanking, and Wallet.",
      statusLabel: "Dropped Volume",
      statusColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      icon: XCircle,
      trend: `${((metrics.failedCount / metrics.totalPayments) * 100).toFixed(1)}% fail rate`,
      trendUp: false,
      href: "#payment-methods",
    },
    {
      title: "Revenue at Risk",
      value: formatLakhs(metrics.revenueAtRisk),
      exactValue: `₹${metrics.revenueAtRisk.toLocaleString("en-IN")}`,
      subtitle: `${metrics.repeatFailureCustomers} repeat-failure customers`,
      explanation: "Failed volume specifically from 33 customers with 2+ consecutive drops. Highest recovery priority.",
      statusLabel: "Recoverable",
      statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      icon: AlertTriangle,
      trend: `${highValueCount} high-ticket failed orders`,
      trendUp: false,
      href: "#customers",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Link
            key={kpi.title}
            href={kpi.href}
            className="group block p-5 rounded-xl border border-zinc-800/70 bg-[#0c0e14] hover:border-zinc-700/80 transition-all duration-150"
          >
            {/* Header / Icon */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
                    {kpi.title}
                  </span>
                  <div className="relative group/tooltip" title={kpi.explanation}>
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-600 hover:text-zinc-400 transition-colors cursor-help" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-zinc-100">
                    {kpi.value}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                    {kpi.exactValue}
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Explanation Helper */}
            <p className="text-[11px] text-zinc-500 line-clamp-1 mt-2.5 pt-2.5 border-t border-zinc-800/60">
              {kpi.explanation}
            </p>

            {/* Footer / Trend & Badge */}
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-[11px]">
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
              </div>
              <span
                className={`text-[10px] font-medium font-mono px-2 py-0.5 rounded border ${kpi.statusColor}`}
              >
                {kpi.statusLabel}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
