"use client";

import { useState, useMemo, useEffect } from "react";
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
  X,
  History,
  AlertCircle,
} from "lucide-react";
import type { CustomerOperationalSummary, PaymentRecord } from "@/lib/db/queries";

type CustomerFilter = "ALL" | "HIGH_FRICTION" | "HIGH_VALUE_RISK" | "STABLE";

interface CustomersSectionProps {
  customers: CustomerOperationalSummary[];
  payments?: PaymentRecord[];
}

export function CustomersSection({ customers, payments = [] }: CustomersSectionProps) {
  const [filter, setFilter] = useState<CustomerFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [displayCount, setDisplayCount] = useState(15);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Compute summary stats
  const stats = useMemo(() => {
    const total = customers.length;
    const highFriction = customers.filter((c) => c.riskSignal === "HIGH_FRICTION");
    const highValueRisk = customers.filter((c) => c.riskSignal === "HIGH_VALUE_RISK");
    const recoverableAtRisk = highFriction.reduce((sum, c) => sum + c.failedVolume, 0);
    const totalFailedVolume = customers.reduce((sum, c) => sum + c.failedVolume, 0);

    return {
      total,
      highFrictionCount: highFriction.length,
      highValueRiskCount: highValueRisk.length,
      stableCount: total - highFriction.length - highValueRisk.length,
      recoverableAtRisk,
      totalFailedVolume,
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

  // Selected customer for slide-over dossier
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [selectedCustomerId, customers]);

  // Payments for selected customer
  const customerPayments = useMemo(() => {
    if (!selectedCustomerId || !payments.length) return [];
    return payments.filter((p) => p.customer_id === selectedCustomerId);
  }, [selectedCustomerId, payments]);

  // Handle ESC key to close dossier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedCustomerId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative">
      <div className="rounded-lg border border-white/[0.08] bg-[#0e121b] p-5 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/[0.08] gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                Customer Risk & Recovery Workspace
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                Live Database
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Identify high-friction accounts, repeated transaction failures, and recoverable merchant revenue
            </p>
          </div>

          <Link
            href="/copilot?q=Prepare%20a%20recovery%20plan%20for%20repeated%20failure%20customers"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors self-start sm:self-auto px-3 py-1.5 rounded bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Prepare Recovery Plan in Copilot</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded border border-white/[0.06] bg-[#090a0f]">
            <span className="text-[11px] text-zinc-400 block font-medium">Monitored Accounts</span>
            <span className="text-xl font-bold font-mono text-zinc-100 mt-1 block tabular-nums">
              {stats.total}
            </span>
          </div>

          <div className="p-3.5 rounded border border-rose-500/20 bg-[#090a0f]">
            <span className="text-[11px] text-rose-300 block font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              Repeated Drops (2+)
            </span>
            <span className="text-xl font-bold font-mono text-rose-400 mt-1 block tabular-nums">
              {stats.highFrictionCount}
            </span>
          </div>

          <div className="p-3.5 rounded border border-amber-500/20 bg-[#090a0f]">
            <span className="text-[11px] text-amber-300 block font-medium flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              High-Value Risk (≥₹10k)
            </span>
            <span className="text-xl font-bold font-mono text-amber-300 mt-1 block tabular-nums">
              {stats.highValueRiskCount}
            </span>
          </div>

          <div className="p-3.5 rounded border border-white/[0.06] bg-[#090a0f]">
            <span className="text-[11px] text-zinc-400 block font-medium">Recoverable at Risk</span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block tabular-nums">
              ₹{stats.recoverableAtRisk.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Apple Segmented Control Pills */}
          <div className="flex items-center bg-[#090a0f] p-1 rounded-md border border-white/[0.08] overflow-x-auto">
            {[
              { key: "ALL", label: `All (${customers.length})` },
              { key: "HIGH_FRICTION", label: `High Friction (${stats.highFrictionCount})` },
              { key: "HIGH_VALUE_RISK", label: `High-Value Risk (${stats.highValueRiskCount})` },
              { key: "STABLE", label: `Stable (${stats.stableCount})` },
            ].map((tab) => {
              const isActive = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setFilter(tab.key as CustomerFilter);
                    setDisplayCount(15);
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? "bg-white/[0.08] text-white shadow-sm border border-white/[0.12]"
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
              className="w-full bg-[#090a0f] border border-white/[0.08] rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Customer Records Table */}
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center rounded border border-white/[0.06] bg-[#090a0f] text-zinc-400 text-xs">
            No customers match the current filter or search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-white/[0.06] bg-[#090a0f]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                <tr>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Transactions</th>
                  <th className="py-2.5 px-3">Total Volume</th>
                  <th className="py-2.5 px-3">At-Risk Volume</th>
                  <th className="py-2.5 px-3">Latest Status</th>
                  <th className="py-2.5 px-3">Signal</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {visibleCustomers.map((c) => {
                  const isHighFriction = c.riskSignal === "HIGH_FRICTION";
                  const isHighValue = c.riskSignal === "HIGH_VALUE_RISK";
                  const isSelected = selectedCustomerId === c.id;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomerId(c.id)}
                      className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${
                        isSelected ? "bg-white/[0.05] ring-1 ring-inset ring-blue-500/30" : ""
                      }`}
                    >
                      {/* Customer Name & Masked Email */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-zinc-100">{c.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {c.maskedEmail}
                        </div>
                      </td>

                      {/* Transaction Count */}
                      <td className="py-2.5 px-3 font-mono">
                        <span className="text-zinc-200">{c.totalTransactions}</span>
                        {c.failedTransactions > 0 ? (
                          <span className="text-[10px] text-rose-400 ml-1.5">
                            ({c.failedTransactions} failed)
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 ml-1.5">
                            (0 failed)
                          </span>
                        )}
                      </td>

                      {/* Total Volume */}
                      <td className="py-2.5 px-3 font-mono text-zinc-200 tabular-nums">
                        ₹{c.totalVolume.toLocaleString("en-IN")}
                      </td>

                      {/* At Risk Volume */}
                      <td className="py-2.5 px-3 font-mono tabular-nums">
                        {c.failedVolume > 0 ? (
                          <span className="text-rose-400 font-semibold">
                            ₹{c.failedVolume.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-zinc-600">₹0</span>
                        )}
                      </td>

                      {/* Latest Payment Status */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          {c.latestStatus === "SUCCESS" ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : c.latestStatus === "FAILED" ? (
                            <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          )}
                          <span
                            className={
                              c.latestStatus === "SUCCESS"
                                ? "text-emerald-400"
                                : c.latestStatus === "FAILED"
                                ? "text-rose-400"
                                : "text-amber-300"
                            }
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
                      <td className="py-2.5 px-3">
                        {isHighFriction ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium font-mono px-1.5 py-0.5 rounded text-rose-400 bg-rose-500/10 border border-rose-500/20">
                            <span className="w-1 h-1 rounded-full bg-rose-400" />
                            {c.failedTransactions} Drops
                          </span>
                        ) : isHighValue ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium font-mono px-1.5 py-0.5 rounded text-amber-400 bg-amber-500/10 border border-amber-500/20">
                            <span className="w-1 h-1 rounded-full bg-amber-400" />
                            High Value
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium font-mono px-1.5 py-0.5 rounded text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                            <span className="w-1 h-1 rounded-full bg-emerald-400" />
                            Stable
                          </span>
                        )}
                      </td>

                      {/* Action CTAs */}
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerId(c.id)}
                            className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-[11px] font-mono border border-white/[0.08] transition-colors"
                          >
                            Dossier
                          </button>
                          <Link
                            href={`/copilot?q=${encodeURIComponent(
                              `Investigate payment failures for customer ${c.name} (${c.maskedEmail}) and recommend recovery action`
                            )}`}
                            className="p-1 rounded hover:bg-white/[0.08] text-zinc-400 hover:text-blue-400 transition-colors"
                            title="Investigate in Copilot"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
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
              className="px-4 py-2 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-zinc-300 transition-colors"
            >
              Show More Customers ({filteredCustomers.length - displayCount} remaining)
            </button>
          </div>
        )}
      </div>

      {/* NON-DESTRUCTIVE SLIDE-OVER CUSTOMER DOSSIER */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedCustomerId(null)}
          />

          {/* Dossier Panel */}
          <aside className="relative z-10 w-full max-w-md bg-[#0e121b] border-l border-white/[0.1] shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-white/[0.08] bg-[#090a0f] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-zinc-100">
                    {selectedCustomer.name}
                  </h3>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      selectedCustomer.riskSignal === "HIGH_FRICTION"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : selectedCustomer.riskSignal === "HIGH_VALUE_RISK"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {selectedCustomer.riskSignal.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 font-mono mt-0.5">
                  {selectedCustomer.maskedEmail} • ID: {selectedCustomer.id.slice(0, 8)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Dossier Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Account Telemetry Summary */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded border border-white/[0.06] bg-[#090a0f]">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Lifetime Volume</span>
                  <span className="text-base font-bold font-mono text-zinc-100 mt-1 block tabular-nums">
                    ₹{selectedCustomer.totalVolume.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="p-3 rounded border border-rose-500/20 bg-[#090a0f]">
                  <span className="text-[10px] text-rose-300 uppercase font-mono block">Failed Volume</span>
                  <span className="text-base font-bold font-mono text-rose-400 mt-1 block tabular-nums">
                    ₹{selectedCustomer.failedVolume.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="p-3 rounded border border-white/[0.06] bg-[#090a0f]">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Success / Total</span>
                  <span className="text-sm font-mono text-zinc-200 mt-1 block tabular-nums">
                    {selectedCustomer.successfulTransactions} / {selectedCustomer.totalTransactions} attempts
                  </span>
                </div>

                <div className="p-3 rounded border border-white/[0.06] bg-[#090a0f]">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Failure Rate</span>
                  <span className="text-sm font-mono text-rose-400 mt-1 block tabular-nums">
                    {selectedCustomer.totalTransactions > 0
                      ? `${Math.round((selectedCustomer.failedTransactions / selectedCustomer.totalTransactions) * 100)}%`
                      : "0%"}
                  </span>
                </div>
              </div>

              {/* Primary Failure Reason Banner */}
              {selectedCustomer.topFailureReason && (
                <div className="p-3 rounded border border-rose-500/20 bg-rose-500/5 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-semibold text-rose-300 block">
                      Primary Failure Pattern: {selectedCustomer.topFailureReason}
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-0.5 block">
                      {selectedCustomer.failedTransactions} out of {selectedCustomer.totalTransactions} attempts failed authorization on this account.
                    </span>
                  </div>
                </div>
              )}

              {/* Real Payment Timeline */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                  <History className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Transaction Timeline ({customerPayments.length} recorded)</span>
                </div>

                {customerPayments.length === 0 ? (
                  <div className="p-6 text-center rounded border border-white/[0.06] bg-[#090a0f] text-zinc-500 text-xs font-mono">
                    No individual transaction events recorded in buffer.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerPayments.map((p) => {
                      const isSuccess = p.status === "SUCCESS";
                      return (
                        <div
                          key={p.payment_id}
                          className="p-2.5 rounded border border-white/[0.06] bg-[#090a0f] flex items-center justify-between text-xs font-mono"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-zinc-200">
                                {p.payment_id}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-400">
                                {p.method}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              {new Date(p.created_at).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            {p.failure_reason && (
                              <div className="text-[10px] text-rose-400 font-sans">
                                {p.failure_reason}
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="font-semibold text-zinc-100 tabular-nums">
                              ₹{Number(p.amount).toLocaleString("en-IN")}
                            </div>
                            <div className="flex items-center justify-end gap-1 text-[10px] mt-0.5">
                              {isSuccess ? (
                                <span className="text-emerald-400 flex items-center gap-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> SUCCESS
                                </span>
                              ) : (
                                <span className="text-rose-400 flex items-center gap-0.5">
                                  <XCircle className="w-2.5 h-2.5" /> FAILED
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 border-t border-white/[0.08] bg-[#090a0f] space-y-2">
              <Link
                href={`/copilot?q=${encodeURIComponent(
                  `Prepare a recovery plan for customer ${selectedCustomer.name} (${selectedCustomer.maskedEmail}) who experienced ${selectedCustomer.failedTransactions} failed transactions`
                )}`}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Prepare Recovery Action in Copilot</span>
              </Link>
              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                className="w-full py-1.5 px-3 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 text-xs font-medium border border-white/[0.06] transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
