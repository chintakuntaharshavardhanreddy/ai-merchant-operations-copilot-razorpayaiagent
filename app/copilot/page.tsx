import Link from "next/link";
import { ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Badge } from "@/components/ui/Badge";
import { CopilotWorkbench } from "@/components/copilot/CopilotWorkbench";

interface CopilotPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function CopilotPage({ searchParams }: CopilotPageProps) {
  const params = await searchParams;
  const initialQuery = params.q || null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#090A0F]">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Copilot Workbench Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-white/[0.08] bg-[#090a0f] px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] rounded-md transition-colors border border-white/[0.08] lg:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-sm font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Operations Copilot Workbench
                </h1>
                <Badge variant="success" size="sm" dot>
                  RAG Policy Online
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Investigate gateway anomalies, diagnose failed rails, inspect repeat friction, and propose controlled actions
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0e121b] border border-white/[0.08] text-xs text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Operator Approval Enforced</span>
            </div>
            <Link
              href="/dashboard"
              className="px-3 py-1 text-xs font-medium text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-md transition-colors"
            >
              Overview
            </Link>
          </div>
        </header>

        {/* 2-Column Responsive Copilot Layout */}
        <main className="flex-1 overflow-y-auto p-6">
          <CopilotWorkbench initialQuery={initialQuery} />
        </main>
      </div>
    </div>
  );
}
