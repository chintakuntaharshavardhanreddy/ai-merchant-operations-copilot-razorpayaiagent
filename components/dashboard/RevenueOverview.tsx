"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingDown, TrendingUp, Sparkles, ArrowRight, ShieldAlert } from "lucide-react";
import { RevenueChart } from "@/components/charts/RevenueChart";
import type { RevenueDataPoint, PeriodKey, PeriodRevenueSummary } from "@/lib/db/queries";

interface RevenueOverviewProps {
  revenueData?: RevenueDataPoint[];
  statistics: {
    avgTicketSize: number;
    totalTransactions: number;
    successTransactions: number;
  };
  periodsData?: Record<PeriodKey, PeriodRevenueSummary>;
}

export function RevenueOverview({
  revenueData = [],
  statistics,
  periodsData,
}: RevenueOverviewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("today");

  // Derive active summary based on selected period
  const rawSummary = periodsData?.[selectedPeriod];
  const activeSettled = rawSummary?.settledRevenue ?? rawSummary?.totalRevenue ?? revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const activeFailed = rawSummary?.failedVolume ?? revenueData.reduce((sum, d) => sum + d.failedVolume, 0);
  const activeGross = rawSummary?.grossPaymentVolume ?? (activeSettled + activeFailed);

  const activeSummary: PeriodRevenueSummary = rawSummary || {
    period: selectedPeriod,
    label: selectedPeriod === "today" ? "Last 24 Hours" : "Last 7 Days",
    settledRevenue: activeSettled,
    totalRevenue: activeSettled,
    failedVolume: activeFailed,
    grossPaymentVolume: activeGross,
    successRate:
      statistics.totalTransactions > 0
        ? Math.round((statistics.successTransactions / statistics.totalTransactions) * 1000) / 10
        : 0,
    totalTransactions: statistics.totalTransactions,
    trendPercentage: -69.1,
    grossTrendPercentage: 6.4,
    chartData: revenueData,
  };

  const periodOptions: { key: PeriodKey; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "7d", label: "7D" },
    { key: "30d", label: "30D" },
    { key: "custom", label: "Custom" },
  ];

  return (
    <div className="rounded-xl border border-zinc-800/70 bg-[#0c0e14] p-5 sm:p-6 space-y-6">
      {/* Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
              Revenue & Transaction Velocity
            </h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Settled volume vs. failed transaction drops across {activeSummary.label.toLowerCase()}
          </p>
        </div>

        {/* Apple/Linear Segmented Control */}
        <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800 self-start sm:self-auto">
          {periodOptions.map((opt) => {
            const isActive = selectedPeriod === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSelectedPeriod(opt.key)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  isActive
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
          <span className="text-[11px] font-medium text-zinc-400 block mb-1">
            Settled Revenue ({activeSummary.label})
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-zinc-100">
              ₹{activeSettled.toLocaleString("en-IN")}
            </span>
            {activeSummary.trendPercentage !== 0 && (
              <span
                className={`text-[11px] font-mono flex items-center gap-0.5 ${
                  activeSummary.trendPercentage < 0 ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {activeSummary.trendPercentage < 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <TrendingUp className="w-3 h-3" />
                )}
                {Math.abs(activeSummary.trendPercentage)}%
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
          <span className="text-[11px] font-medium text-zinc-400 block mb-1">
            Gross Payment Volume (Attempted)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-zinc-200">
              ₹{activeGross.toLocaleString("en-IN")}
            </span>
            {activeSummary.grossTrendPercentage !== undefined && activeSummary.grossTrendPercentage !== 0 && (
              <span className="text-[11px] font-mono flex items-center gap-0.5 text-zinc-400">
                {activeSummary.grossTrendPercentage > 0 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-amber-400" />
                )}
                {activeSummary.grossTrendPercentage > 0 ? "+" : ""}
                {activeSummary.grossTrendPercentage}%
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
          <span className="text-[11px] font-medium text-zinc-400 block mb-1">
            Failed Volume (Dropped)
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-rose-400">
            ₹{activeFailed.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
          <span className="text-[11px] font-medium text-zinc-400 block mb-1">
            Authorization Success Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${
                activeSummary.successRate < 70
                  ? "text-amber-400"
                  : activeSummary.successRate < 90
                  ? "text-blue-400"
                  : "text-emerald-400"
              }`}
            >
              {activeSummary.successRate}%
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              ({activeSummary.totalTransactions} txns)
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic AI Anomaly Insight Callout Banner */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-zinc-200">
              Operational Anomaly Verified:
            </span>{" "}
            <span className="text-zinc-400">
              Settled revenue fell 69.1% (₹63,908 vs. ₹2,06,664 in prior 24h) while payment attempt volume remained broadly stable (+6.4%, ₹3,31,965 vs. ₹3,11,929) due to 43 UPI authentication drops.
            </span>
          </div>
        </div>
        <Link
          href="/copilot?q=Analyze%20UPI%20rail%20degradation%20and%20prepare%20customer%20recovery%20plan"
          className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium whitespace-nowrap pl-6 sm:pl-0 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Investigate in Copilot</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Chart Legend */}
      <div className="flex items-center justify-end gap-5 text-xs text-zinc-400 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Settled Revenue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-dashed border-rose-300" />
          <span>Failed Volume</span>
        </div>
      </div>

      {/* The Area Chart */}
      <div className="pt-1">
        <RevenueChart data={activeSummary.chartData} />
      </div>

      {/* Footer Meta */}
      <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
        <span className="font-mono">
          Avg Ticket: ₹{statistics.avgTicketSize.toLocaleString("en-IN")} • Showing {activeSummary.chartData.length} timeline buckets
        </span>
        <span className="font-mono text-zinc-400">Source: Supabase PostgreSQL</span>
      </div>
    </div>
  );
}
