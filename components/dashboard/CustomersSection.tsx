"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Search,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { CustomerOperationalSummary } from "@/lib/db/queries";

type CustomerFilter = "ALL" | "HIGH_FRICTION" | "HIGH_VALUE_RISK" | "STABLE";

interface CustomersSectionProps {
  customers: CustomerOperationalSummary[];
}

export function CustomersSection({ customers }: CustomersSectionProps) {
  const [filter, setFilter] = useState<CustomerFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [displayCount, setDisplayCount] = useState(10);

  // Compute summary stats
  const stats = useMemo(() => {
    const total = customers.length;
    const highFriction = customers.filter((c) => c.riskSignal === "HIGH_FRICTION");
    const highValueRisk = customers.filter((c) => c.riskSignal === "HIGH_VALUE_RISK");
    const totalAtRiskVolume = customers.reduce((sum, c) => sum + c.failedVolume, 0);

    return {
      total,
      highFrictionCount: highFriction.length,
      highValueRiskCount: highValueRisk.length,
      totalAtRiskVolume,
    };
  }, [customers]);

  // Filtered list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Tab filter
      if (filter !== "ALL" && c.riskSignal !== filter) return false;

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          c.name.toLowerCase().includes(term) ||
          c.maskedEmail.toLowerCase().includes(term) ||
          (c.topFailureReason && c.topFailureReason.toLowerCase().includes(term))
        );
      }

      return true;
    });
  }, [customers, filter, searchTerm]);

  const visibleCustomers = filteredCustomers.slice(0, displayCount);

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6 backdrop-blur-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-800/60 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
              Customer Risk & Friction Telemetry
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Live Database
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Identify high-friction accounts, repeated transaction failures, and recoverable merchant revenue
          </p>
        </div>

        <Link
          href="/copilot?q=Prepare%20a%20recovery%20plan%20for%20repeated%20failure%20customers"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors self-start sm:self-auto px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/30"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Prepare Recovery Plan in Copilot</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-800/40">
          <span className="text-[11px] text-zinc-400 block font-medium">Monitored Customers</span>
          <span className="text-xl font-bold font-mono text-zinc-100 mt-1 block">
            {stats.total}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-rose-500/20">
          <span className="text-[11px] text-rose-300 block font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Repeated Failures (2+)
          </span>
          <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
            {stats.highFrictionCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-amber-500/20">
          <span className="text-[11px] text-amber-300 block font-medium flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            High-Value At Risk
          </span>
          <span className="text-xl font-bold font-mono text-amber-300 mt-1 block">
            {stats.highValueRiskCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-800/40">
          <span className="text-[11px] text-zinc-400 block font-medium">Total At-Risk Volume</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            ₹{stats.totalAtRiskVolume.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Filter Controls & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Apple Segmented Control Pills */}
        <div className="flex items-center bg-zinc-950/70 p-1 rounded-xl border border-zinc-800/90 overflow-x-auto">
          {[
            { key: "ALL", label: `All (${customers.length})` },
            { key: "HIGH_FRICTION", label: `High Friction (${stats.highFrictionCount})` },
            { key: "HIGH_VALUE_RISK", label: `High-Value Risk (${stats.highValueRiskCount})` },
            { key: "STABLE", label: `Stable (${customers.length - stats.highFrictionCount - stats.highValueRiskCount})` },
          ].map((tab) => {
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setFilter(tab.key as CustomerFilter);
                  setDisplayCount(10);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/50"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customer or reason..."
            className="w-full bg-zinc-950/70 border border-zinc-800/90 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Customer Records Table */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-zinc-950/30 border border-zinc-800/40 text-zinc-400 text-xs">
          No customers match the current filter or search criteria.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800/70 bg-zinc-950/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 border-b border-zinc-800/80 text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Transactions</th>
                <th className="py-3 px-4">Total Volume</th>
                <th className="py-3 px-4">At-Risk Volume</th>
                <th className="py-3 px-4">Latest Status</th>
                <th className="py-3 px-4">Operational Signal</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {visibleCustomers.map((c) => {
                const isHighFriction = c.riskSignal === "HIGH_FRICTION";
                const isHighValue = c.riskSignal === "HIGH_VALUE_RISK";

                return (
                  <tr
                    key={c.id}
                    className="hover:bg-zinc-900/50 transition-colors group"
                  >
                    {/* Customer Name & Masked Email */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-100">{c.name}</div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        {c.maskedEmail}
                      </div>
                    </td>

                    {/* Transaction Count */}
                    <td className="py-3.5 px-4">
                      <div className="text-zinc-200 font-mono">
                        {c.totalTransactions} total
                      </div>
                      {c.failedTransactions > 0 ? (
                        <div className="text-[11px] text-rose-400 font-mono mt-0.5">
                          {c.failedTransactions} failed
                        </div>
                      ) : (
                        <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                          0 failed
                        </div>
                      )}
                    </td>

                    {/* Total Volume */}
                    <td className="py-3.5 px-4 font-mono text-zinc-200 font-medium">
                      ₹{c.totalVolume.toLocaleString("en-IN")}
                    </td>

                    {/* At Risk Volume */}
                    <td className="py-3.5 px-4 font-mono">
                      {c.failedVolume > 0 ? (
                        <span className="text-rose-400 font-semibold">
                          ₹{c.failedVolume.toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-zinc-500">₹0</span>
                      )}
                    </td>

                    {/* Latest Payment Status */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {c.latestStatus === "SUCCESS" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : c.latestStatus === "FAILED" ? (
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span
                          className={`font-mono text-[11px] font-medium ${
                            c.latestStatus === "SUCCESS"
                              ? "text-emerald-400"
                              : c.latestStatus === "FAILED"
                              ? "text-rose-400"
                              : "text-amber-300"
                          }`}
                        >
                          {c.latestStatus}
                        </span>
                      </div>
                      {c.topFailureReason && (
                        <div className="text-[10px] text-zinc-400 truncate max-w-[130px] mt-0.5">
                          {c.topFailureReason}
                        </div>
                      )}
                    </td>

                    {/* Operational Signal */}
                    <td className="py-3.5 px-4">
                      {isHighFriction ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium font-mono px-2 py-0.5 rounded-full text-rose-400 bg-rose-500/10 border border-rose-500/20">
                          <span className="w-1 h-1 rounded-full bg-rose-400" />
                          {c.failedTransactions} Repeated Drops
                        </span>
                      ) : isHighValue ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium font-mono px-2 py-0.5 rounded-full text-amber-400 bg-amber-500/10 border border-amber-500/20">
                          <span className="w-1 h-1 rounded-full bg-amber-400" />
                          High-Value Risk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium font-mono px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                          <span className="w-1 h-1 rounded-full bg-emerald-400" />
                          Stable
                        </span>
                      )}
                    </td>

                    {/* Action CTA */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/copilot?q=${encodeURIComponent(
                          `Investigate payment failures for customer ${c.name} (${c.maskedEmail}) and recommend recovery action`
                        )}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-blue-600/10 text-zinc-300 hover:text-blue-300 border border-zinc-800 hover:border-blue-500/30 transition-all text-[11px]"
                      >
                        <span>Investigate</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Load More Button */}
      {filteredCustomers.length > displayCount && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setDisplayCount((prev) => prev + 20)}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
          >
            Show More Customers ({filteredCustomers.length - displayCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
