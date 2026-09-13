import Link from "next/link";
import { ShieldCheck, ArrowRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { AgentActionRecord } from "@/lib/db/queries";

interface RecentActionsSectionProps {
  actions: AgentActionRecord[];
}

export function RecentActionsSection({ actions }: RecentActionsSectionProps) {
  return (
    <Card className="bg-[#0D1017]">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#1A2233] gap-2">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <CardTitle>Recent AI Actions & Audit Trail</CardTitle>
            <Badge variant="ai" size="sm">
              Human-in-the-Loop
            </Badge>
          </div>
          <CardDescription>
            Audit log of agent-proposed operational plans, support tickets, and approved executions
          </CardDescription>
        </div>

        <Link
          href="/copilot"
          className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span>Open Copilot Workbench</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>

      <div className="pt-4">
        {actions.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-[#11151F] border border-[#1E2638] text-zinc-400 text-xs">
            No agent actions recorded yet. Open Copilot to propose recovery plans or support cases.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {actions.map((act) => {
              const isApproved = act.status === "EXECUTED" || act.status === "APPROVED";
              const isRejected = act.status === "REJECTED";

              return (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl bg-[#11151F] border border-[#1E2638] space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                        {act.action_type.replace(/_/g, " ")}
                      </span>
                      <Badge
                        variant={isApproved ? "success" : isRejected ? "error" : "ai"}
                        size="sm"
                      >
                        {act.status}
                      </Badge>
                    </div>

                    <h4 className="text-xs font-semibold text-zinc-100 leading-snug">
                      {act.title}
                    </h4>

                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {act.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#182030] flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                    <div className="flex items-center gap-1">
                      {isApproved ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : isRejected ? (
                        <XCircle className="w-3 h-3 text-rose-400" />
                      ) : (
                        <Clock className="w-3 h-3 text-amber-400" />
                      )}
                      <span>
                        {act.executed_at
                          ? new Date(act.executed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : new Date(act.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <span>
                      {act.estimated_value > 0
                        ? `₹${Math.round(act.estimated_value).toLocaleString("en-IN")}`
                        : "Operational"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
