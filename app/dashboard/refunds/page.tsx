import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { RecentActionsSection } from "@/components/dashboard/RecentActionsSection";
import { getRefundAnalytics, getRefundRecords, getRecentAgentActions } from "@/lib/db/queries";
import Link from "next/link";
import { ChevronRight, Clock, CheckCircle2, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RefundsPage() {
  const [analytics, refundRecords, agentActions] = await Promise.all([
    getRefundAnalytics(),
    getRefundRecords(50),
    getRecentAgentActions(20),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#090A0F]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title="Refund Operations & Operator Audit Trail"
          subtitle="Real-time refund settlement queue, dispute reasons, and human-in-the-loop action authorizations"
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
          {/* 1. REFUND METRICS STRIP */}
          <section aria-label="Refund Telemetry Metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-lg border border-white/[0.08] bg-[#0e121b]">
              <span className="text-[11px] text-zinc-400 block font-medium">Total Refund Records</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-zinc-100 tabular-nums">
                  {analytics.totalRefundCount}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  (₹{analytics.totalRefundAmount.toLocaleString("en-IN")})
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-amber-500/20 bg-[#0e121b]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-amber-300 block font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Pending Queue
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {analytics.pendingRefundsCount} items
                </span>
              </div>
              <span className="text-xl font-bold font-mono text-amber-400 mt-1 block tabular-nums">
                ₹{analytics.pendingRefundsAmount.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="p-4 rounded-lg border border-emerald-500/20 bg-[#0e121b]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-emerald-300 block font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Processed Settlements
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {analytics.processedRefundsCount} items
                </span>
              </div>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block tabular-nums">
                ₹{analytics.processedRefundsAmount.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="p-4 rounded-lg border border-white/[0.08] bg-[#0e121b]">
              <span className="text-[11px] text-zinc-400 block font-medium">Operator Proposals</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-blue-400 tabular-nums">
                  {agentActions.filter((a) => a.status === "PENDING_APPROVAL").length}
                </span>
                <span className="text-[11px] text-zinc-400">
                  awaiting authorization
                </span>
              </div>
            </div>
          </section>

          {/* 2. OPERATOR ACTIONS & AUDIT TRAIL */}
          <section aria-label="Operator Approval Queue">
            <RecentActionsSection actions={agentActions} />
          </section>

          {/* 3. REAL REFUND QUEUE & LEDGER */}
          <section aria-label="Refund Queue & Ledger" className="rounded-lg border border-white/[0.08] bg-[#0e121b] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-white/[0.08] gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                    Refund Settlement Ledger
                  </h2>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Live Supabase Telemetry
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Full historical records of merchant refund requests, settlement states, and merchant reasons
                </p>
              </div>

              <Link
                href="/copilot?q=Review%20all%20pending%20refunds%20and%20recommend%20approval%20strategy"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Evaluate Refunds in Copilot</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded border border-white/[0.06] bg-[#090a0f]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                  <tr>
                    <th className="py-2.5 px-3">Refund ID</th>
                    <th className="py-2.5 px-3">Payment Ref</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Created</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-mono text-[11px]">
                  {refundRecords.map((r) => {
                    const isPending = r.status === "PENDING";
                    const isProcessed = r.status === "PROCESSED";

                    return (
                      <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3 text-zinc-200 font-semibold">
                          #{r.id.slice(0, 8)}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400">
                          {r.payment_id}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-zinc-100 tabular-nums">
                          ₹{Number(r.amount).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                              isProcessed
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : isPending
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {isProcessed ? (
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            ) : (
                              <Clock className="w-2.5 h-2.5" />
                            )}
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-300 font-sans text-xs">
                          {r.reason || "Customer requested"}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400">
                          {new Date(r.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href={`/copilot?q=${encodeURIComponent(
                              `Audit refund #${r.id.slice(0, 8)} of ₹${r.amount} for payment ${r.payment_id} (${r.reason})`
                            )}`}
                            className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
