"use client";

import {
  CheckCircle2,
  XCircle,
  Activity,
  Cpu,
  FileText,
  Sparkles,
  Loader2,
  Database,
  TrendingDown,
  Users,
  Search,
  Receipt,
  ShieldAlert,
  HelpCircle,
  Clock,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface ActivityStep {
  step: string;
  detail: string;
  time: string;
  completed: boolean;
  error?: boolean;
}

interface AIActivityPanelProps {
  activitySteps?: ActivityStep[];
  toolsUsed?: string[];
  isLoading?: boolean;
}

const defaultSteps: ActivityStep[] = [
  {
    step: "Autonomous Agent Initialized",
    detail: "Gemini agent ready for multi-tool operational reasoning & proposals",
    time: "0ms",
    completed: true,
  },
  {
    step: "Database Telemetry Rails",
    detail: "Connected to Supabase merchant, payment, refund & action tables",
    time: "15ms",
    completed: true,
  },
  {
    step: "Knowledge Base (RAG)",
    detail: "Indexed 5 merchant operational policy playbooks",
    time: "30ms",
    completed: true,
  },
  {
    step: "Human-in-the-Loop Guardrail",
    detail: "Actions strictly gated by operator authorization",
    time: "0ms",
    completed: true,
  },
];

const allToolMeta: Record<
  string,
  { name: string; desc: string; icon: typeof Database; isAction?: boolean }
> = {
  get_dashboard_metrics: {
    name: "get_dashboard_metrics()",
    desc: "Gross revenue, success rate, and risk summary",
    icon: Database,
  },
  get_revenue_trend: {
    name: "get_revenue_trend()",
    desc: "24h comparative velocity and drop detection",
    icon: TrendingDown,
  },
  get_payment_health: {
    name: "get_payment_health()",
    desc: "Rail health & latency (UPI, Cards, Netbanking)",
    icon: Activity,
  },
  search_payments: {
    name: "search_payments()",
    desc: "Structured filtering over transactions",
    icon: Search,
  },
  analyze_failed_payments: {
    name: "analyze_failed_payments()",
    desc: "Root-cause diagnostics and high-value drops",
    icon: Sparkles,
  },
  find_repeated_failure_customers: {
    name: "find_repeated_failure_customers()",
    desc: "Cluster analysis of consecutive failed attempts",
    icon: Users,
  },
  get_refund_analytics: {
    name: "get_refund_analytics()",
    desc: "Processed vs. pending refunds & reason codes",
    icon: Receipt,
  },
  search_merchant_knowledge: {
    name: "search_merchant_knowledge()",
    desc: "Vector similarity search over policy docs",
    icon: FileText,
  },
  prepare_recovery_plan: {
    name: "prepare_recovery_plan()",
    desc: "Controlled action: propose recovery plan for repeated failures",
    icon: ShieldAlert,
    isAction: true,
  },
  prepare_support_case: {
    name: "prepare_support_case()",
    desc: "Controlled action: propose operational support escalation ticket",
    icon: HelpCircle,
    isAction: true,
  },
  prepare_refund: {
    name: "prepare_refund()",
    desc: "Controlled action: propose policy-grounded refund authorization",
    icon: Receipt,
    isAction: true,
  },
};

export function AIActivityPanel({
  activitySteps,
  toolsUsed = [],
  isLoading,
}: AIActivityPanelProps) {
  const steps = activitySteps && activitySteps.length > 0 ? activitySteps : defaultSteps;

  // Filter or list tools executed
  const displayedTools =
    toolsUsed.length > 0
      ? toolsUsed.map((t) => allToolMeta[t] || { name: `${t}()`, desc: "Operational tool", icon: Database })
      : [
          allToolMeta.get_dashboard_metrics,
          allToolMeta.get_payment_health,
          allToolMeta.prepare_recovery_plan,
          allToolMeta.search_merchant_knowledge,
        ];

  return (
    <Card className="bg-[#0C0F16] border-[#1C2333] space-y-4">
      {/* Activity Header */}
      <CardHeader className="pb-3 border-b border-[#182030] flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Agent Execution Trace
          </span>
        </div>
        <Badge variant="ai" size="sm">
          {isLoading ? "Reasoning..." : toolsUsed.length > 0 ? `${toolsUsed.length} Tools Invoked` : "Agent Ready"}
        </Badge>
      </CardHeader>

      {/* Execution Trace Steps */}
      <div className="space-y-3 px-1">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-3 text-xs group">
            <div className="pt-0.5 shrink-0">
              {step.error ? (
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
              ) : step.completed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : step.step.toLowerCase().includes("waiting") ? (
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              ) : (
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`font-medium ${step.error ? "text-rose-300" : step.completed ? "text-zinc-200" : "text-amber-300"}`}>
                  {step.step}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {step.time}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate">
                {step.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tools Section */}
      <div className="pt-3 border-t border-[#182030] space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              {toolsUsed.length > 0 ? "Tools Invoked in Session" : "Available Operational Tools"}
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded">
            Controlled Actions Enabled
          </span>
        </div>

        <div className="space-y-1.5">
          {displayedTools.map((tool) => {
            const Icon = tool.icon;
            const isAction = tool.isAction || false;
            return (
              <div
                key={tool.name}
                className="flex items-center justify-between p-2 rounded-lg bg-[#111622] border border-[#1E273A] text-xs font-mono text-zinc-300"
              >
                <div className="flex items-center gap-2 truncate">
                  <Icon className={`w-3 h-3 shrink-0 ${isAction ? "text-amber-400" : "text-blue-400"}`} />
                  <span className={`font-semibold ${isAction ? "text-amber-300" : "text-blue-300"}`}>
                    {tool.name}
                  </span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${
                  isAction
                    ? "bg-amber-950/40 text-amber-300 border-amber-800/40"
                    : "bg-[#171F30] text-zinc-400 border-[#232F47]"
                }`}>
                  {isAction ? "Proposal Gated" : toolsUsed.includes(tool.name.replace("()", "")) ? "Executed" : "Read Tool"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
