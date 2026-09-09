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

const data = [
  { time: "00:00", revenue: 42000, failedVolume: 2400 },
  { time: "03:00", revenue: 28000, failedVolume: 1200 },
  { time: "06:00", revenue: 35000, failedVolume: 1800 },
  { time: "09:00", revenue: 112000, failedVolume: 9200 },
  { time: "12:00", revenue: 198000, failedVolume: 14500 },
  { time: "15:00", revenue: 245000, failedVolume: 18200 },
  { time: "18:00", revenue: 310000, failedVolume: 22000 },
  { time: "21:00", revenue: 270000, failedVolume: 16000 },
];

export function RevenueChart() {
  return (
    <div className="w-full h-64 select-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
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
