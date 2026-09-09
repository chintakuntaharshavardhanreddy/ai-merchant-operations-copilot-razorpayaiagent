import Link from "next/link";
import { ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Badge } from "@/components/ui/Badge";
import { ChatInterface } from "@/components/copilot/ChatInterface";
import { AIActivityPanel } from "@/components/copilot/AIActivityPanel";
import { AgenticActionCard } from "@/components/copilot/AgenticActionCard";

export default function CopilotPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#090A0F]">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Copilot Workbench Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-[#1F2533] bg-[#090A0F]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-[#151922] rounded-lg transition-colors border border-transparent hover:border-[#202738] lg:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  AI Merchant Operations Copilot
                </h1>
                <Badge variant="success" size="sm" dot>
                  AI Online
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Ask questions about payments, revenue, refunds, settlements, and merchant operations.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#121620] border border-[#1F2637] text-xs text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Human Approval Enforced</span>
            </div>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-[#141824] hover:bg-[#1A2030] border border-[#222B3E] rounded-lg transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </header>

        {/* 2-Column Responsive Copilot Layout */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">
            {/* Primary Chat Surface (8 cols on large screens) */}
            <div className="lg:col-span-8 flex flex-col h-full">
              <ChatInterface />
            </div>

            {/* Right Panel: Agentic Action & Execution Trace (4 cols on large screens) */}
            <div className="lg:col-span-4 space-y-5">
              {/* Agentic Human-in-the-loop Action Card */}
              <section aria-label="AI Proposed Action">
                <AgenticActionCard />
              </section>

              {/* Live AI Activity & Function Trace */}
              <section aria-label="AI Activity Trace and Tools">
                <AIActivityPanel />
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
