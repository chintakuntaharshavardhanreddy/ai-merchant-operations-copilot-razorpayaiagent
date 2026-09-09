import {
  CheckCircle2,
  Terminal,
  Activity,
  Cpu,
  Database,
  FileText,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function AIActivityPanel() {
  const activitySteps = [
    {
      title: "Understanding merchant request",
      detail: "Parsed intent: failure root cause & customer impact",
      time: "120ms",
      completed: true,
    },
    {
      title: "Querying payment data",
      detail: "Scanned 5,380 transactions for today's failure codes",
      time: "340ms",
      completed: true,
    },
    {
      title: "Searching knowledge base",
      detail: "Retrieved 3 chunks from payment-failures.md & refund-policy.md",
      time: "210ms",
      completed: true,
    },
    {
      title: "Analyzing transaction patterns",
      detail: "Identified cluster of 27 users with repeat card declines",
      time: "185ms",
      completed: true,
    },
    {
      title: "Generating recommendation",
      detail: "Prepared recovery action proposal & synthesized findings",
      time: "290ms",
      completed: true,
    },
  ];

  const toolsUsed = [
    {
      name: "get_payment()",
      desc: "Fetches individual transaction telemetry",
      icon: Terminal,
      status: "called",
    },
    {
      name: "search_payments()",
      desc: "Filter by status: failed, gateway: UPI, time: 24h",
      icon: Database,
      status: "312 results",
    },
    {
      name: "search_knowledge_base()",
      desc: "Query: 'payment failure retry guidelines'",
      icon: FileText,
      status: "3 chunks",
    },
  ];

  return (
    <Card className="bg-[#0C0F16] border-[#1C2333] space-y-4">
      {/* Activity Header */}
      <CardHeader className="pb-3 border-b border-[#182030] flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            AI Activity
          </span>
        </div>
        <Badge variant="ai" size="sm">
          Execution Trace
        </Badge>
      </CardHeader>

      {/* Execution Trace Steps */}
      <div className="space-y-3 px-1">
        {activitySteps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-3 text-xs group">
            <div className="pt-0.5 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-200">
                  {step.title}
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

      {/* Tools Used Section */}
      <div className="pt-3 border-t border-[#182030] space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Tools Used
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            Gemini Function Calling
          </span>
        </div>

        <div className="space-y-1.5">
          {toolsUsed.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.name}
                className="flex items-center justify-between p-2 rounded-lg bg-[#111622] border border-[#1E273A] text-xs font-mono text-zinc-300"
              >
                <div className="flex items-center gap-2 truncate">
                  <Icon className="w-3 h-3 text-blue-400 shrink-0" />
                  <span className="text-blue-300 font-semibold">{tool.name}</span>
                </div>
                <span className="text-[10px] bg-[#171F30] text-zinc-400 px-1.5 py-0.5 rounded border border-[#232F47] shrink-0">
                  {tool.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
