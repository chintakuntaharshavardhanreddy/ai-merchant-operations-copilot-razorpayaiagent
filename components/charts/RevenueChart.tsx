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
  const chartData = data.length > 0
    ? data.map((d) => ({ time: d.hour, revenue: d.revenue, failedVolume: d.failedVolume }))
    : [{ time: "No data", revenue: 0, failedVolume: 0 }];

  return (
    <div className="w-full h-64 select-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1C2333"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            stroke="#525E75"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "#1C2333" }}
          />
          <YAxis
            stroke="#525E75"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₹${value / 1000}k`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-[#0C0F17] border border-[#232C3F] rounded-lg p-3 shadow-xl text-xs space-y-1">
                    <div className="font-medium text-zinc-300 mb-1">{label}</div>
                    <div className="flex items-center gap-2 text-blue-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Settled: ₹{payload[0]?.value?.toLocaleString("en-IN")}</span>
                    </div>
                    {payload[1] && (
                      <div className="flex items-center gap-2 text-rose-400 font-mono">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>Failed: ₹{payload[1]?.value?.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#3B82F6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#revenueGradient)"
          />
          <Area
            type="monotone"
            dataKey="failedVolume"
            stroke="#F43F5E"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#failedGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
