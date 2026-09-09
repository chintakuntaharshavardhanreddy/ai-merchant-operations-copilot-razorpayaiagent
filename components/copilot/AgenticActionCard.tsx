"use client";

import { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface AgenticActionProps {
  title?: string;
  description?: string;
  potentialRevenue?: string;
  targetCount?: number;
  riskLevel?: "Low" | "Medium" | "High";
}

export function AgenticActionCard({
  title = "Prepare recovery actions for 27 customers",
  description = "Trigger smart re-attempt notifications via WhatsApp & SMS with automated alternative gateway link for users with repeat card declines.",
  potentialRevenue = "₹84,200",
  targetCount = 27,
  riskLevel = "Low",
}: AgenticActionProps) {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");

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
          <span className="text-[10px] text-zinc-400 font-mono">Risk: {riskLevel}</span>
          <Badge variant="ai" size="sm">
            Human Approval
          </Badge>
        </div>
      </CardHeader>

      <div className="pt-3 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-zinc-100 leading-snug">
            {title}
          </h4>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#111520] border border-[#1C2538]">
          <div>
            <span className="text-[11px] text-zinc-400 block">
              Potential Revenue
            </span>
            <span className="text-base font-bold font-mono text-emerald-400">
              {potentialRevenue}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 block">
              Impacted Merchants/Users
            </span>
            <span className="text-base font-bold font-mono text-zinc-200">
              {targetCount} Customers
            </span>
          </div>
        </div>

        {/* Action Controls / Status */}
        {status === "pending" ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                onClick={() => setStatus("rejected")}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                onClick={() => setStatus("approved")}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Approve Action
              </Button>
            </div>
            <p className="text-[10px] text-center text-zinc-400">
              Requires human confirmation before dispatching recovery triggers
            </p>
          </div>
        ) : status === "approved" ? (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Action Approved (Mock)</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Logged to Audit Trail #ACT-84920. Future phase will invoke API dispatcher.
            </p>
            <button
              onClick={() => setStatus("pending")}
              className="text-[10px] text-zinc-400 underline hover:text-zinc-300 pt-1 block mx-auto"
            >
              Reset to pending
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-400">
              <XCircle className="w-4 h-4" />
              <span>Action Rejected</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              No changes executed. Recommendation archived.
            </p>
            <button
              onClick={() => setStatus("pending")}
              className="text-[10px] text-zinc-400 underline hover:text-zinc-300 pt-1 block mx-auto"
            >
              Reset to pending
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
