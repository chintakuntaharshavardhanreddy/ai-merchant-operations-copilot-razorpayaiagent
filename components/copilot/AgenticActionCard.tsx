"use client";

import { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  FileCheck2,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { AgentActionRecord } from "@/lib/db/queries";

interface AgenticActionProps {
  proposal?: AgentActionRecord | null;
  onActionResolved?: (action: AgentActionRecord) => void;
}

export function AgenticActionCard({
  proposal,
  onActionResolved,
}: AgenticActionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localAction, setLocalAction] = useState<AgentActionRecord | null>(null);

  const activeAction = localAction || proposal;

  const handleResolve = async (operation: "approve" | "reject") => {
    if (!activeAction) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation,
          actionId: activeAction.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${operation} action.`);
      }

      setLocalAction(data.action);
      onActionResolved?.(data.action);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!activeAction) {
    return (
      <Card className="bg-[#0C0F16] border-[#1C2333] relative overflow-hidden">
        <CardHeader className="pb-3 border-b border-[#182030] flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Agentic Action Guardrail
            </span>
          </div>
          <Badge variant="neutral" size="sm">
            Human-in-the-Loop
          </Badge>
        </CardHeader>
        <div className="p-4 text-center space-y-2">
          <Clock className="w-6 h-6 text-zinc-500 mx-auto" />
          <p className="text-xs text-zinc-400 font-medium">No Pending Action Proposals</p>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            When you ask the Copilot to prepare recovery plans, create support cases, or evaluate refunds, structured action proposals will appear here for your explicit authorization.
          </p>
        </div>
      </Card>
    );
  }

  const isPending = activeAction.status === "PENDING_APPROVAL";
  const isExecuted = activeAction.status === "EXECUTED" || activeAction.status === "APPROVED";
  const isRejected = activeAction.status === "REJECTED";

  return (
    <Card className="bg-[#0C0F16] border-[#222B3F] relative overflow-hidden">
      {/* Accent strip on top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

      <CardHeader className="pb-3 border-b border-[#182030] flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            AI Proposed Action
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-400 font-mono">
            {activeAction.action_type.replace(/_/g, " ")}
          </span>
          <Badge variant={isPending ? "ai" : isExecuted ? "success" : "error"} size="sm">
            {activeAction.status}
          </Badge>
        </div>
      </CardHeader>

      <div className="pt-3 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-zinc-100 leading-snug">
            {activeAction.title}
          </h4>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            {activeAction.description}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#111520] border border-[#1C2538]">
          <div>
            <span className="text-[11px] text-zinc-400 block">
              Estimated Value
            </span>
            <span className="text-base font-bold font-mono text-emerald-400">
              {activeAction.estimated_value > 0
                ? `₹${activeAction.estimated_value.toLocaleString("en-IN")}`
                : "Operational"}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 block">
              Target Reference
            </span>
            <span className="text-xs font-bold font-mono text-zinc-200 truncate block mt-1">
              {activeAction.target_id || "Operations Management"}
            </span>
          </div>
        </div>

        {/* Policy Basis */}
        {activeAction.policy_sources && activeAction.policy_sources.length > 0 && (
          <div className="p-2.5 rounded-lg bg-[#0C101A] border border-[#1B2436] flex items-start gap-2 text-xs">
            <FileCheck2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Policy Basis
              </span>
              <span className="text-zinc-300 font-mono text-[11px]">
                {activeAction.policy_sources.join(", ")}
              </span>
            </div>
          </div>
        )}

        {/* Error message banner */}
        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Action Controls / Status */}
        {isPending ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                disabled={isProcessing}
                onClick={() => handleResolve("reject")}
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                )}
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                disabled={isProcessing}
                onClick={() => handleResolve("approve")}
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                )}
                Approve Action
              </Button>
            </div>
            <p className="text-[10px] text-center text-zinc-400">
              Requires human confirmation before executing demo operational trigger
            </p>
          </div>
        ) : isExecuted ? (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Action Executed (SIMULATED)</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Logged to Audit Trail #{activeAction.id.slice(0, 8)}. Safe demo operation completed.
            </p>
          </div>
        ) : isRejected ? (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-400">
              <XCircle className="w-4 h-4" />
              <span>Action Rejected by Operator</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              No changes executed. Proposal permanently archived in audit log.
            </p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
