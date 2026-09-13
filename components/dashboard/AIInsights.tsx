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
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
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

function getSignalBadge(severity: string): "error" | "warning" | "neutral" {
  switch (severity) {
    case "high":
      return "error";
    case "medium":
      return "warning";
    default:
      return "neutral";
  }
}

export function AIInsights({ signals = [] }: AIInsightsProps) {
  const hasSignals = signals.length > 0;

  return (
    <Card className="bg-[#0D1017]">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#1A2233] gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <CardTitle>Operational Signals & Insights</CardTitle>
            <Badge variant="ai" size="sm">
              Data-Driven
            </Badge>
          </div>
          <CardDescription>
            Deterministic operational anomaly detection and payment performance alerts
          </CardDescription>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161B26] border border-[#232B3D] text-[11px] text-zinc-400 self-start sm:self-auto">
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span>{hasSignals ? `${signals.length} Active Signals` : "All Rails Normal"}</span>
        </div>
      </CardHeader>

      <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {!hasSignals ? (
          <div className="col-span-full flex flex-col items-center justify-center p-8 bg-[#11151F] border border-[#1E2638] rounded-xl text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
            <h4 className="text-sm font-semibold text-zinc-200">No Operational Anomalies Detected</h4>
            <p className="text-xs text-zinc-400 max-w-md">
              Payment success rates and transaction volumes across all rails are currently operating within expected thresholds. Connect Supabase and run seed data to explore telemetry signals.
            </p>
          </div>
        ) : (
          signals.map((signal) => {
            const Icon = getSignalIcon(signal.category);
            const badgeVariant = getSignalBadge(signal.severity);
            const actionHref = `/copilot?q=${encodeURIComponent(signal.title)}`;

            return (
              <div
                key={signal.id}
                className="p-4 rounded-xl bg-[#11151F] border border-[#1E2638] flex flex-col justify-between hover:border-[#2C384F] transition-all space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                      {signal.category}
                    </span>
                    <Badge variant={badgeVariant} size="sm">
                      {signal.severity.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-md bg-[#181F2E] border border-[#222B3F] text-zinc-300 shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-zinc-300" />
                    </div>
                    <h4 className="text-xs font-semibold text-zinc-100 leading-snug">
                      {signal.title}
                    </h4>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {signal.description}
                  </p>

                  <div className="p-2.5 rounded-lg bg-[#0C0F16] border border-[#1A2233] space-y-1">
                    <div className="text-[11px] font-medium text-amber-300/90 font-mono">
                      Impact: {signal.impact}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Rec: {signal.recommendation}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#182030]">
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
    </Card>
  );
}
