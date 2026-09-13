"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  FileCheck,
} from "lucide-react";
import type { AgentActionRecord } from "@/lib/db/queries";

interface RecentActionsSectionProps {
  actions: AgentActionRecord[];
}

export function RecentActionsSection({ actions: initialActions }: RecentActionsSectionProps) {
  const [actionList, setActionList] = useState<AgentActionRecord[]>(initialActions);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ id: string; text: string; type: "success" | "error" } | null>(null);

  const pendingActions = actionList.filter(
    (a) => a.status === "PENDING_APPROVAL" && !a.approved
  );
  const historicalActions = actionList.filter(
    (a) => a.status !== "PENDING_APPROVAL" || a.approved
  );

  const handleAction = async (actionId: string, operation: "approve" | "reject") => {
    setProcessingId(actionId);
    setFeedbackMessage(null);

    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, operation, reason: `Operator ${operation} from dashboard audit trail` }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${operation} action.`);
      }

      // Update state locally
      setActionList((prev) =>
        prev.map((act) => {
          if (act.id === actionId) {
            return {
              ...act,
              status: operation === "approve" ? "EXECUTED" : "REJECTED",
              approved: operation === "approve",
              executed_at: new Date().toISOString(),
              approved_at: operation === "approve" ? new Date().toISOString() : null,
            };
          }
          return act;
        })
      );

      setFeedbackMessage({
        id: actionId,
        text: operation === "approve" ? "Action executed successfully." : "Action proposal rejected.",
        type: "success",
      });
    } catch (err: unknown) {
      setFeedbackMessage({
        id: actionId,
        text: err instanceof Error ? err.message : "Error executing action.",
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0e121b] p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/[0.08] gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
              Operator Approval Queue & Audit Trail
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Operator Approval Required
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Operational action proposals requiring explicit human authorization prior to execution
          </p>
        </div>

        <Link
          href="/copilot"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors self-start sm:self-auto"
        >
          <span>Open Copilot Workbench</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Pending Approval Elevated Banner */}
      {pendingActions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Action Proposals Awaiting Merchant Operator Authorization ({pendingActions.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingActions.map((act) => {
              const isProcessing = processingId === act.id;
              const hasFeedback = feedbackMessage?.id === act.id;

              return (
                <div
                  key={act.id}
                  className="p-4 rounded-xl bg-gradient-to-b from-amber-500/5 to-zinc-950/60 border border-amber-500/30 space-y-3 flex flex-col justify-between shadow-lg shadow-black/20"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {act.action_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {new Date(act.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-zinc-100 leading-snug">
                      {act.title}
                    </h4>

                    <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed">
                      {act.description}
                    </p>

                    {/* Policy Citation */}
                    {act.policy_sources && act.policy_sources.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono pt-1">
                        <FileCheck className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="truncate">Policy: {act.policy_sources[0]}</span>
                      </div>
                    )}
                  </div>

                  {/* Feedback Message */}
                  {hasFeedback && (
                    <div
                      className={`text-[11px] p-2 rounded-lg ${
                        feedbackMessage.type === "success"
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                      }`}
                    >
                      {feedbackMessage.text}
                    </div>
                  )}

                  {/* Action Execution Controls */}
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-semibold text-amber-300">
                      {act.estimated_value > 0
                        ? `₹${Math.round(act.estimated_value).toLocaleString("en-IN")}`
                        : "Operational"}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleAction(act.id, "reject")}
                        className="px-3 py-1 text-xs font-medium rounded-lg text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/30 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleAction(act.id, "approve")}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 transition-all disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Executing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approve & Execute</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Audit Trail Cards */}
      <div className="space-y-3 pt-1">
        <span className="text-xs font-medium text-zinc-400 block">
          Execution Audit Log ({historicalActions.length} recorded events)
        </span>

        {historicalActions.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-zinc-950/30 border border-zinc-800/40 text-zinc-400 text-xs">
            No executed agent actions recorded yet. Open Copilot to propose actions.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {historicalActions.map((act) => {
              const isApproved = act.status === "EXECUTED" || act.status === "APPROVED";
              const isRejected = act.status === "REJECTED";

              return (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60 space-y-2.5 flex flex-col justify-between hover:border-zinc-700/80 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                        {act.action_type.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-medium font-mono px-2 py-0.5 rounded-full border ${
                          isApproved
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : isRejected
                            ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                            : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-zinc-100 leading-snug">
                      {act.title}
                    </h4>

                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {act.description}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
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
                    <span className="font-semibold text-zinc-300">
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
    </div>
  );
}
