import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { PaymentHealth } from "@/components/dashboard/PaymentHealth";
import { getPaymentHealth, getFailedPayments } from "@/lib/db/queries";
import Link from "next/link";
import { AlertCircle, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const [healthData, failedPayments] = await Promise.all([
    getPaymentHealth(),
    getFailedPayments({ limit: 30 }),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#090A0F]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title="Payment Rails & Diagnostics"
          subtitle="Real-time rail health, authorization benchmarks, and gateway failure classification"
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
          {/* 1. RAIL DIAGNOSTIC MATRIX */}
          <section aria-label="Payment Rails Health">
            <PaymentHealth healthData={healthData} />
          </section>

          {/* 2. RECENT FAILED PAYMENTS STREAM */}
          <section aria-label="Failed Transactions Stream" className="rounded-lg border border-white/[0.08] bg-[#0e121b] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-white/[0.08] gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                    Failed Transaction Stream
                  </h2>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {failedPayments.length} Recent Drops
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Real transactions that failed authorization across UPI, Card, Netbanking, and Wallet rails
                </p>
              </div>

              <Link
                href="/copilot?q=Analyze%20all%20recent%20failed%20payments%20and%20group%20by%20root%20cause"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors self-start sm:self-auto"
              >
                <span>Diagnose Errors in Copilot</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded border border-white/[0.06] bg-[#090a0f]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                  <tr>
                    <th className="py-2.5 px-3">Payment ID</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Failure Reason</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-mono text-[11px]">
                  {failedPayments.map((p) => (
                    <tr key={p.payment_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 text-zinc-200 font-semibold">
                        {p.payment_id}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          p.method === "UPI"
                            ? "bg-amber-500/10 text-amber-400"
                            : p.method === "CARD"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-zinc-800 text-zinc-300"
                        }`}>
                          {p.method}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-rose-400 font-semibold tabular-nums">
                        ₹{Number(p.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{p.failure_reason || "DECLINED"}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">
                        {new Date(p.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          href={`/copilot?q=${encodeURIComponent(`Investigate failed payment ${p.payment_id} of amount ₹${p.amount} on rail ${p.method}`)}`}
                          className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <span>Diagnose</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
