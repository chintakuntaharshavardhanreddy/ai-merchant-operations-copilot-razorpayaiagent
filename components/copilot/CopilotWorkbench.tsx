"use client";

import { useState } from "react";
import { ChatInterface } from "./ChatInterface";
import { AIActivityPanel, ActivityStep } from "./AIActivityPanel";
import { AgenticActionCard } from "./AgenticActionCard";
import type { AgentActionRecord } from "@/lib/db/queries";

interface CopilotWorkbenchProps {
  initialQuery?: string | null;
}

export function CopilotWorkbench({ initialQuery }: CopilotWorkbenchProps) {
  const [activitySteps, setActivitySteps] = useState<ActivityStep[]>([]);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<AgentActionRecord | null>(null);

  const handleTraceUpdate = (
    steps: ActivityStep[],
    tools: string[],
    loading: boolean
  ) => {
    setActivitySteps(steps);
    setToolsUsed(tools);
    setIsLoading(loading);
  };

  const handleActionProposal = (proposal: AgentActionRecord | null) => {
    setCurrentProposal(proposal);
  };

  const handleActionResolved = (resolvedAction: AgentActionRecord) => {
    setCurrentProposal(resolvedAction);

    // Update execution trace steps to reflect human approval / rejection
    const isApproved = resolvedAction.status === "EXECUTED" || resolvedAction.status === "APPROVED";
    setActivitySteps((prev) => [
      ...prev.map((s) =>
        s.step === "Waiting for merchant approval"
          ? { ...s, completed: true, detail: isApproved ? "Authorized by merchant operator" : "Rejected by operator" }
          : s
      ),
      {
        step: isApproved ? "Executing approved action (SIMULATED)" : "Action archived as rejected",
        detail: isApproved ? `Completed: ${resolvedAction.title}` : "No mutations were performed",
        time: "15ms",
        completed: true,
      },
      {
        step: isApproved ? "Audit log entry created" : "Audit trail recorded",
        detail: `Record ID: #${resolvedAction.id.slice(0, 8)}`,
        time: "5ms",
        completed: true,
      },
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">
      {/* Primary Chat Surface (8 cols on large screens) */}
      <div className="lg:col-span-8 flex flex-col h-full">
        <ChatInterface
          onTraceUpdate={handleTraceUpdate}
          onActionProposal={handleActionProposal}
          initialQuery={initialQuery}
        />
      </div>

      {/* Right Panel: Agentic Action & Execution Trace (4 cols on large screens) */}
      <div className="lg:col-span-4 space-y-5">
        {/* Agentic Human-in-the-loop Action Card */}
        <section aria-label="AI Proposed Action">
          <AgenticActionCard
            proposal={currentProposal}
            onActionResolved={handleActionResolved}
          />
        </section>

        {/* Live AI Activity & Multi-Tool Execution Trace */}
        <section aria-label="AI Activity Trace and Tools">
          <AIActivityPanel
            activitySteps={activitySteps}
            toolsUsed={toolsUsed}
            isLoading={isLoading}
          />
        </section>
      </div>
    </div>
  );
}
