import Link from "next/link";
import {
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import type { OperationalSignal } from "@/lib/db/queries";

interface AIInsightsProps {
  signals?: OperationalSignal[];
}

function getSignalIcon(category: string) {
  switch (category.toLowerCase()) {
    case "rail anomaly":
      return AlertTriangle;
    case "revenue drift":
    case "revenue risk":
      return TrendingDown;
    case "customer friction":
    default:
      return RefreshCw;
  }
}

function getSignalBadgeClass(severity: string): string {
  switch (severity) {
    case "high":
      return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    case "medium":
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    default:
      return "text-blue-400 bg-blue-500/10 border-blue-500/20";
  }
}

export function AIInsights({ signals = [] }: AIInsightsProps) {
  const hasSignals = signals.length > 0;

  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0e121b] p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-white/[0.08] gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
            Active Operational Signals & Anomalies
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-white/[0.06]">
            {hasSignals ? `${signals.length} Issues Detected` : "Normal"}
          </span>
        </div>
        <p className="text-[11px] text-zinc-400">
          Automated rule-based detection across authorization drops, high-value losses, and repeat friction
        </p>
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {!hasSignals ? (
          <div className="col-span-full flex flex-col items-center justify-center p-8 bg-[#090a0f] border border-white/[0.06] rounded text-center space-y-1">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h4 className="text-xs font-semibold text-zinc-200">No Operational Anomalies Detected</h4>
            <p className="text-[11px] text-zinc-400">
              Payment success rates and transaction volumes across all rails are operating within thresholds.
            </p>
          </div>
        ) : (
          signals.map((signal) => {
            const Icon = getSignalIcon(signal.category);
            const badgeClass = getSignalBadgeClass(signal.severity);
            const actionHref = `/copilot?q=${encodeURIComponent(signal.title)}`;

            return (
              <div
                key={signal.id}
                className="rounded bg-[#090a0f] border border-white/[0.06] p-3.5 flex flex-col justify-between hover:border-white/[0.12] transition-colors space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                      {signal.category}
                    </span>
                    <span
                      className={`text-[9px] font-medium font-mono px-1.5 py-0.2 rounded border ${badgeClass}`}
                    >
                      {signal.severity.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <Icon className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <h3 className="text-xs font-semibold text-zinc-100 leading-snug">
                      {signal.title}
                    </h3>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {signal.description}
                  </p>

                  <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04] space-y-0.5 text-[11px]">
                    <div className="text-amber-400 font-mono">
                      Impact: {signal.impact}
                    </div>
                    <div className="text-zinc-400">
                      Action: {signal.recommendation}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.04]">
                  <Link
                    href={actionHref}
                    className="flex items-center justify-between text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors group"
                  >
                    <span>Investigate in Copilot</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
