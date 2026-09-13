"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { RevenueDataPoint } from "@/lib/db/queries";

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center rounded-xl bg-zinc-900/20 border border-zinc-800/40 text-center px-4">
        <p className="text-sm font-medium text-zinc-400">No telemetry recorded for this timeframe</p>
        <p className="text-xs text-zinc-500 mt-1">Telemetry will appear as transactions are processed.</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    time: d.hour,
    revenue: d.revenue,
    failedVolume: d.failedVolume,
  }));

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${Math.round(val / 1000)}k`;
    return `₹${val}`;
  };

  return (
    <div className="w-full h-64 select-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 12, right: 8, left: -16, bottom: 0 }}
        >
          <defs>
            <linearGradient id="settledGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.28} />
              <stop offset="90%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2} />
              <stop offset="90%" stopColor="#f43f5e" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="2 4"
            stroke="rgba(255, 255, 255, 0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
            dy={4}
          />
          <YAxis
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const settled = Number(payload[0]?.value || 0);
                const failed = Number(payload[1]?.value || 0);
                const total = settled + failed;
                const failureRate = total > 0 ? ((failed / total) * 100).toFixed(1) : "0";

                return (
                  <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/95 backdrop-blur-md p-3.5 shadow-2xl text-xs space-y-2 min-w-[170px]">
                    <div className="font-medium text-zinc-300 border-b border-zinc-800/80 pb-1.5 flex items-center justify-between">
                      <span>{label}</span>
                      {total > 0 && (
                        <span className="text-[10px] font-mono text-zinc-500">
                          {failureRate}% fail rate
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-blue-400 font-mono">
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          Settled
                        </span>
                        <span className="font-semibold">₹{settled.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-rose-400 font-mono">
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          Failed
                        </span>
                        <span className="font-semibold">₹{failed.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#settledGradient)"
            activeDot={{ r: 4, stroke: "#60a5fa", strokeWidth: 2, fill: "#1e3a8a" }}
          />
          <Area
            type="monotone"
            dataKey="failedVolume"
            stroke="#f43f5e"
            strokeWidth={1.75}
            strokeDasharray="4 3"
            fillOpacity={1}
            fill="url(#failedGradient)"
            activeDot={{ r: 4, stroke: "#fb7185", strokeWidth: 2, fill: "#881337" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
