import Link from "next/link";
import {
  Sparkles,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  ArrowRight,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function AIInsights() {
  const insights = [
    {
      id: "insight-1",
      title: "UPI failure rate increased across SBI & HDFC handles",
      category: "Rail Anomaly",
      severity: "high" as const,
      badgeVariant: "error" as const,
      timestamp: "14 mins ago",
      icon: AlertTriangle,
      description:
        "Elevated gateway timeout rate (error code U30) detected on UPI collections. Failure rate spiked from 4.1% to 8.2% between 17:30 and 19:00 IST.",
      impact: "₹46,200 potential failed volume",
      recommendation: "Switch primary routing priority to ICICI & Axis gateways.",
      actionLabel: "Investigate in Copilot",
      actionHref: "/copilot?q=Why did UPI failure rate increase?",
    },
    {
      id: "insight-2",
      title: "Revenue declined 7.4% compared with previous period",
      category: "Revenue Drift",
      severity: "medium" as const,
      badgeVariant: "warning" as const,
      timestamp: "1 hour ago",
      icon: TrendingDown,
      description:
        "Settled volume is ₹12.4L vs ₹13.4L during the matching 24-hour cycle. Higher drop-off observed during checkout 3DS authentication step.",
      impact: "₹1,00,000 variance against forecast",
      recommendation: "Inspect gateway fallback rules for international Mastercard cards.",
      actionLabel: "Analyze Revenue",
      actionHref: "/copilot?q=Why did my revenue drop yesterday?",
    },
    {
      id: "insight-3",
      title: "Multiple repeated payment failures detected (27 customers)",
      category: "Customer Friction",
      severity: "high" as const,
      badgeVariant: "warning" as const,
      timestamp: "2 hours ago",
      icon: RefreshCw,
      description:
        "27 high-intent customers faced consecutive authorization failures (2–4 attempts each). 82% failed on insufficient balance and card velocity limits.",
      impact: "₹84,200 recoverable revenue at risk",
      recommendation: "Dispatch automated WhatsApp payment link with alternative payment rails.",
      actionLabel: "Review Recovery Action",
      actionHref: "/copilot?action=recovery_27",
    },
  ];

  return (
    <Card className="bg-[#0D1017]">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#1A2233] gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <CardTitle>AI Operational Insights</CardTitle>
            <Badge variant="ai" size="sm">
              Gemini Powered
            </Badge>
          </div>
          <CardDescription>
            Autonomous anomaly detection and payment performance alerts
          </CardDescription>
        </div>

        {/* Demo Notice */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161B26] border border-[#232B3D] text-[11px] text-zinc-400 self-start sm:self-auto">
          <Info className="w-3.5 h-3.5 text-zinc-400" />
          <span>Placeholder Demo Content</span>
        </div>
      </CardHeader>

      <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight) => {
          const Icon = insight.icon;
          return (
            <div
              key={insight.id}
              className="p-4 rounded-xl bg-[#11151F] border border-[#1E2638] flex flex-col justify-between hover:border-[#2C384F] transition-all space-y-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    {insight.category}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {insight.timestamp}
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-md bg-[#181F2E] border border-[#222B3F] text-zinc-300 shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-zinc-300" />
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-100 leading-snug">
                    {insight.title}
                  </h4>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {insight.description}
                </p>

                <div className="p-2.5 rounded-lg bg-[#0C0F16] border border-[#1A2233] space-y-1">
                  <div className="text-[11px] font-medium text-amber-300/90 font-mono">
                    Impact: {insight.impact}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Rec: {insight.recommendation}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#182030]">
                <Link
                  href={insight.actionHref}
                  className="flex items-center justify-between text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors group"
                >
                  <span>{insight.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
