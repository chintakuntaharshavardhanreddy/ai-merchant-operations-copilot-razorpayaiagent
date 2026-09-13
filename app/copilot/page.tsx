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
      {/* Navigation Sidebar — hidden on mobile */}
      <Sidebar className="hidden lg:flex" />

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
                  RAG Online
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
          <CopilotWorkbench initialQuery={initialQuery} />
        </main>
      </div>
    </div>
  );
}
