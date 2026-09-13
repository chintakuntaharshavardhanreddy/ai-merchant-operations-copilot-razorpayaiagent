"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { RevenueChart } from "@/components/charts/RevenueChart";
import type { RevenueDataPoint } from "@/lib/db/queries";

interface RevenueOverviewProps {
  revenueData: RevenueDataPoint[];
  statistics: {
    avgTicketSize: number;
    totalTransactions: number;
    successTransactions: number;
  };
}

export function RevenueOverview({ revenueData, statistics }: RevenueOverviewProps) {
  const [period, setPeriod] = useState("Today");

  const grossVolume = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const totalFailed = revenueData.reduce((sum, d) => sum + d.failedVolume, 0);

  return (
    <Card className="bg-[#0D1017]">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-3 border-b border-[#1A2233]">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Revenue & Transaction Velocity</CardTitle>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
              {revenueData.length > 0 ? "Supabase Live" : "No Data"}
            </span>
          </div>
          <CardDescription>
            Settled revenue vs. failed volume across 24h operational window
          </CardDescription>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center gap-1 bg-[#121622] p-1 rounded-lg border border-[#1F273A] self-start sm:self-auto">
          {["Today", "7D", "30D", "Custom"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                period === p
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </CardHeader>

      <div className="pt-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[11px] text-zinc-400 block">Gross Volume</span>
              <span className="text-xl font-bold font-mono text-zinc-100">
                ₹{grossVolume.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="h-8 w-px bg-[#1F273A]" />
            <div>
              <span className="text-[11px] text-zinc-400 block">Average Ticket Size</span>
              <span className="text-xl font-bold font-mono text-zinc-100">
                ₹{statistics.avgTicketSize.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="h-8 w-px bg-[#1F273A] hidden md:block" />
            <div className="hidden md:block">
              <span className="text-[11px] text-zinc-400 block">Total Transactions</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {statistics.totalTransactions.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
              <span>Settled Volume</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 border border-dashed border-rose-300" />
              <span>Failed Volume</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="pt-2">
          <RevenueChart data={revenueData} />
        </div>

        <div className="pt-2 border-t border-[#182030] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>
              {totalFailed > 0
                ? `₹${totalFailed.toLocaleString("en-IN")} failed volume in window`
                : "No failed volume in window"}
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Source: Supabase
          </span>
        </div>
      </div>
    </Card>
  );
}
