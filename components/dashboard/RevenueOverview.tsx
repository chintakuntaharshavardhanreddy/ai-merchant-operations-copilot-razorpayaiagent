"use client";

import { useState } from "react";
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

  const rawSummary = periodsData?.[selectedPeriod];
  const activeSettled =
    rawSummary?.settledRevenue ??
    rawSummary?.totalRevenue ??
    revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const activeFailed =
    rawSummary?.failedVolume ?? revenueData.reduce((sum, d) => sum + d.failedVolume, 0);
  const activeGross = rawSummary?.grossPaymentVolume ?? activeSettled + activeFailed;

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
    { key: "today", label: "Today (24H)" },
    { key: "7d", label: "7D" },
    { key: "30d", label: "30D" },
    { key: "custom", label: "Custom" },
  ];

  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0e121b] p-5 space-y-4">
      {/* Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
              Payment Velocity & Settlement Curve
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-white/[0.06]">
              {activeSummary.label}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Real-time hourly volume velocity: settled revenue (solid) vs. dropped volume (dashed)
          </p>
        </div>

        {/* Apple/Linear Segmented Control */}
        <div className="flex items-center bg-[#090a0f] p-0.5 rounded-md border border-white/[0.08] self-start sm:self-auto">
          {periodOptions.map((opt) => {
            const isActive = selectedPeriod === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSelectedPeriod(opt.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  isActive
                    ? "bg-[#141a26] text-zinc-100 border border-white/[0.08] shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Strip & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4 font-mono">
          <div>
            <span className="text-zinc-400 text-[11px]">Settled: </span>
            <span className="text-white font-semibold tabular-nums">
              ₹{activeSettled.toLocaleString("en-IN")}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 text-[11px]">Failed: </span>
            <span className="text-rose-400 font-semibold tabular-nums">
              ₹{activeFailed.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="hidden md:block">
            <span className="text-zinc-400 text-[11px]">Success: </span>
            <span className="text-zinc-200 font-semibold tabular-nums">
              {activeSummary.successRate}%
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1.5 rounded-sm bg-blue-500" />
            <span>Settled Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1.5 rounded-sm bg-rose-500" />
            <span>Failed Volume</span>
          </div>
        </div>
      </div>

      {/* The Area Chart */}
      <div className="pt-2">
        <RevenueChart data={activeSummary.chartData} />
      </div>
    </div>
  );
}
