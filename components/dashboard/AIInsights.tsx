import Link from "next/link";
import {
  Sparkles,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  ArrowRight,
  Database,
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
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6 backdrop-blur-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-800/60 gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
              Operational Signals & Anomaly Detection
            </h2>
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Automated anomaly detection across telemetry benchmarks, authorization drops, and repeat friction
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400 font-mono self-start sm:self-auto">
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span>{hasSignals ? `${signals.length} Active Signals Detected` : "Telemetry Normal"}</span>
        </div>
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {!hasSignals ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 bg-zinc-950/30 border border-zinc-800/40 rounded-xl text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
            <h4 className="text-sm font-semibold text-zinc-200">No Operational Anomalies Detected</h4>
            <p className="text-xs text-zinc-500 max-w-md">
              Payment success rates and transaction volumes across all rails are currently operating within expected thresholds.
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
                className="rounded-xl bg-zinc-950/40 border border-zinc-800/60 p-4 flex flex-col justify-between hover:border-zinc-700/80 transition-all space-y-3.5"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                      {signal.category}
                    </span>
                    <span
                      className={`text-[10px] font-medium font-mono px-2 py-0.5 rounded-full border ${badgeClass}`}
                    >
                      {signal.severity.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80 text-zinc-300 shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-zinc-300" />
                    </div>
                    <h3 className="text-xs font-semibold text-zinc-100 leading-snug">
                      {signal.title}
                    </h3>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {signal.description}
                  </p>

                  <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/70 space-y-1">
                    <div className="text-[11px] font-medium text-amber-300 font-mono">
                      Impact: {signal.impact}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Rec: {signal.recommendation}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/50">
                  <Link
                    href={actionHref}
                    className="flex items-center justify-between text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors group"
                  >
                    <span>Investigate in Copilot</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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
