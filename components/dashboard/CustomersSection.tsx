"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
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
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { CustomerOperationalSummary } from "@/lib/db/queries";

interface CustomersSectionProps {
  customers: CustomerOperationalSummary[];
}

export function CustomersSection({ customers }: CustomersSectionProps) {
  const [filter, setFilter] = useState<"ALL" | "HIGH_FRICTION" | "HIGH_VALUE_RISK" | "STABLE">("ALL");
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
    <Card className="bg-[#0D1017]">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#1A2233] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <CardTitle>Customer Risk & Friction Telemetry</CardTitle>
            <Badge variant="ai" size="sm">
              Live Database
            </Badge>
          </div>
          <CardDescription>
            High-friction customers, repeated transaction failures, and recoverable merchant revenue
          </CardDescription>
        </div>

        <Link
          href="/copilot?q=Prepare%20a%20recovery%20plan%20for%20repeated%20failure%20customers"
          className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Prepare Recovery Plan in Copilot</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>

      <div className="pt-4 space-y-4">
        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[#11151F] border border-[#1E2638]">
            <span className="text-[11px] text-zinc-400 block font-medium">Monitored Customers</span>
            <span className="text-xl font-bold font-mono text-zinc-100 mt-0.5 block">
              {stats.total}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#11151F] border border-rose-500/20">
            <span className="text-[11px] text-rose-300 block font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              Repeated Failures (2+)
            </span>
            <span className="text-xl font-bold font-mono text-rose-400 mt-0.5 block">
              {stats.highFrictionCount}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#11151F] border border-amber-500/20">
            <span className="text-[11px] text-amber-300 block font-medium flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              High-Value At Risk
            </span>
            <span className="text-xl font-bold font-mono text-amber-300 mt-0.5 block">
              {stats.highValueRiskCount}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#11151F] border border-[#1E2638]">
            <span className="text-[11px] text-zinc-400 block font-medium">Total At-Risk Volume</span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block">
              ₹{stats.totalAtRiskVolume.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => {
                setFilter("ALL");
                setDisplayCount(10);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === "ALL"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "bg-[#141824] text-zinc-400 hover:text-zinc-200 border border-[#222B3E]"
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => {
                setFilter("HIGH_FRICTION");
                setDisplayCount(10);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === "HIGH_FRICTION"
                  ? "bg-rose-600 text-white shadow-sm shadow-rose-500/20"
                  : "bg-[#141824] text-zinc-400 hover:text-zinc-200 border border-[#222B3E]"
              }`}
            >
              High Friction ({stats.highFrictionCount})
            </button>
            <button
              onClick={() => {
                setFilter("HIGH_VALUE_RISK");
                setDisplayCount(10);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === "HIGH_VALUE_RISK"
                  ? "bg-amber-600 text-white shadow-sm shadow-amber-500/20"
                  : "bg-[#141824] text-zinc-400 hover:text-zinc-200 border border-[#222B3E]"
              }`}
            >
              High-Value Risk ({stats.highValueRiskCount})
            </button>
            <button
              onClick={() => {
                setFilter("STABLE");
                setDisplayCount(10);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === "STABLE"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                  : "bg-[#141824] text-zinc-400 hover:text-zinc-200 border border-[#222B3E]"
              }`}
            >
              Stable ({customers.length - stats.highFrictionCount - stats.highValueRiskCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer or reason..."
              className="w-full bg-[#11151F] border border-[#1E2638] rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* Customer Records Table / List */}
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[#11151F] border border-[#1E2638] text-zinc-400 text-xs">
            No customers match the current filter or search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#1E2638]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0A0C12] border-b border-[#1A2233] text-[11px] uppercase tracking-wider text-zinc-400">
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
              <tbody className="divide-y divide-[#161C28] bg-[#0E121B]">
                {visibleCustomers.map((c) => {
                  const isHighFriction = c.riskSignal === "HIGH_FRICTION";
                  const isHighValue = c.riskSignal === "HIGH_VALUE_RISK";

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[#131824] transition-colors group"
                    >
                      {/* Customer Name & Masked Email */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-100">{c.name}</div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          {c.maskedEmail}
                        </div>
                      </td>

                      {/* Transaction Count */}
                      <td className="py-3 px-4">
                        <div className="text-zinc-200 font-mono">
                          {c.totalTransactions} total
                        </div>
                        {c.failedTransactions > 0 ? (
                          <div className="text-[11px] text-rose-400 font-mono">
                            {c.failedTransactions} failed
                          </div>
                        ) : (
                          <div className="text-[11px] text-emerald-400 font-mono">
                            0 failed
                          </div>
                        )}
                      </td>

                      {/* Total Volume */}
                      <td className="py-3 px-4 font-mono text-zinc-200">
                        ₹{c.totalVolume.toLocaleString("en-IN")}
                      </td>

                      {/* At Risk Volume */}
                      <td className="py-3 px-4 font-mono">
                        {c.failedVolume > 0 ? (
                          <span className="text-rose-400 font-semibold">
                            ₹{c.failedVolume.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-zinc-500">₹0</span>
                        )}
                      </td>

                      {/* Latest Payment Status */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {c.latestStatus === "SUCCESS" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : c.latestStatus === "FAILED" ? (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span
                            className={`font-mono text-[11px] ${
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
                          <div className="text-[10px] text-zinc-500 truncate max-w-[120px]">
                            {c.topFailureReason}
                          </div>
                        )}
                      </td>

                      {/* Operational Signal */}
                      <td className="py-3 px-4">
                        {isHighFriction ? (
                          <Badge variant="error" size="sm" dot>
                            {c.failedTransactions} Repeated Failures
                          </Badge>
                        ) : isHighValue ? (
                          <Badge variant="warning" size="sm" dot>
                            High-Value Risk
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            Stable
                          </Badge>
                        )}
                      </td>

                      {/* Action CTA */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/copilot?q=${encodeURIComponent(
                            `Investigate payment failures for customer ${c.name} (${c.maskedEmail})`
                          )}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#141824] hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-[#222B3E] hover:border-blue-500/30 transition-all text-[11px]"
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
              onClick={() => setDisplayCount((prev) => prev + 20)}
              className="px-4 py-2 rounded-lg bg-[#141824] hover:bg-[#1C2333] border border-[#222B3E] text-xs font-medium text-zinc-300 transition-colors"
            >
              Show More Customers ({filteredCustomers.length - displayCount} remaining)
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
