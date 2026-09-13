import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Activity,
  Search,
  Layers,
  TrendingUp,
  AlertOctagon,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { getDashboardMetrics } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const metrics = await getDashboardMetrics();
  const capabilities = [
    {
      title: "Understand payment performance",
      description:
        "Continuously monitor real-time authorization rates, gateway latency, and checkout drops across UPI, cards, netbanking, and wallets.",
      icon: Activity,
      tag: "Real-time Telemetry",
    },
    {
      title: "Investigate failed transactions",
      description:
        "Pinpoint the root causes of transaction declines—from bank gateway timeouts (U30, ZM) to card velocity throttling and 3DS friction.",
      icon: AlertOctagon,
      tag: "Root Cause Analysis",
    },
    {
      title: "Analyze revenue",
      description:
        "Track gross settlement velocity, isolate period-over-period revenue variances, and detect anomalies before they impact bottom line.",
      icon: TrendingUp,
      tag: "Revenue Intelligence",
    },
    {
      title: "Understand refunds and settlements",
      description:
        "Maintain absolute visibility into T+1 and T+2 settlement cycles, instant refund SLAs, pending holds, and fee breakdowns.",
      icon: RotateCcw,
      tag: "Treasury & Reconciliation",
    },
    {
      title: "Search operational knowledge using AI",
      description:
        "Perform instant semantic RAG lookups across internal payment policies, dispute handling playbooks, and gateway integration docs.",
      icon: Search,
      tag: "Gemini RAG",
    },
    {
      title: "Take controlled operational actions",
      description:
        "Execute automated recovery workflows, customer notification dispatches, and routing failovers with mandatory human-in-the-loop approval.",
      icon: ShieldCheck,
      tag: "Agentic Actions",
    },
  ];

  return (
    <div className="min-h-screen bg-[#08090E] text-zinc-100 selection:bg-blue-600/30 selection:text-blue-200">
      {/* Navigation Bar */}
      <header className="border-b border-[#181F2F] bg-[#08090E]/80 backdrop-blur-md sticky top-0 z-30 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white">
              Merchant Operations Copilot
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              Fintech Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-[#151B27] rounded-lg transition-colors border border-transparent hover:border-[#232D40]"
          >
            Open Dashboard
          </Link>
          <Link
            href="/copilot"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-600/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Try AI Copilot</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 overflow-hidden fintech-grid border-b border-[#151C2C]">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121622] border border-[#212A3E] text-xs text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">
              Next-Gen Merchant Intelligence
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-blue-400 text-[11px] font-mono">Google Gemini Agent Core</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white max-w-3xl mx-auto leading-tight sm:leading-none">
            Merchant Operations Copilot
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 font-normal max-w-2xl mx-auto leading-relaxed">
            AI-powered intelligence for modern payment operations.
          </p>

          <p className="text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Diagnose payment failures in seconds, monitor settlement velocity, search operational knowledge with semantic RAG, and execute high-consequence recovery actions with human approval.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/copilot"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#131824] hover:bg-[#1A2234] text-zinc-200 hover:text-white font-medium text-sm border border-[#232D42] flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Try AI Copilot</span>
            </Link>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-[#0D111A]/90 border border-[#1C2538]">
              <span className="text-xs text-zinc-400 block">Settled Revenue</span>
              <span className="text-xl font-bold font-mono text-zinc-100 tabular-nums">
                ₹{Math.round(metrics.totalRevenue).toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-emerald-400 block mt-0.5">● Real-time settled</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0D111A]/90 border border-[#1C2538]">
              <span className="text-xs text-zinc-400 block">Success Rate</span>
              <span className="text-xl font-bold font-mono text-zinc-100 tabular-nums">
                {metrics.successRate.toFixed(1)}%
              </span>
              <span className="text-[11px] text-amber-400 block mt-0.5">UPI degraded</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0D111A]/90 border border-[#1C2538]">
              <span className="text-xs text-zinc-400 block">Failed Payments</span>
              <span className="text-xl font-bold font-mono text-zinc-100 tabular-nums">
                {metrics.failedCount}
              </span>
              <span className="text-[11px] text-rose-400 block mt-0.5">Investigation queued</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0D111A]/90 border border-[#1C2538]">
              <span className="text-xs text-zinc-400 block">Revenue at Risk</span>
              <span className="text-xl font-bold font-mono text-zinc-100 tabular-nums">
                ₹{Math.round(metrics.revenueAtRisk).toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-blue-400 block mt-0.5">Recovery actionable</span>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Architecture Flow */}
      <section className="py-16 px-6 border-b border-[#151C2C] bg-[#0A0C13]">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <Badge variant="ai" size="sm">
              Architectural Design
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Built for Enterprise Autonomous Operations
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
              Combining structured PostgreSQL payment logs, semantic vector documentation, and strict human authorization before dispatching actions.
            </p>
          </div>

          {/* Flow Visualizer */}
          <div className="p-6 rounded-2xl bg-[#0F1420] border border-[#1E283D] space-y-4 font-mono text-xs">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-xl bg-[#151B2A] border border-[#243048] space-y-1.5">
                <span className="text-blue-400 font-bold block">1. Next.js UI</span>
                <span className="text-zinc-400 text-[11px] font-sans block">
                  Dashboard & Copilot Shell
                </span>
                <span className="text-[10px] text-zinc-400 block">App Router • TypeScript</span>
              </div>
              <div className="p-4 rounded-xl bg-[#151B2A] border border-[#243048] space-y-1.5">
                <span className="text-indigo-400 font-bold block">2. Gemini Agent</span>
                <span className="text-zinc-400 text-[11px] font-sans block">
                  Reasoning & Tool Selection
                </span>
                <span className="text-[10px] text-zinc-400 block">@ai-sdk/google</span>
              </div>
              <div className="p-4 rounded-xl bg-[#151B2A] border border-[#243048] space-y-1.5">
                <span className="text-sky-400 font-bold block">3. Multi-Tool Calling</span>
                <span className="text-zinc-400 text-[11px] font-sans block">
                  SQL Queries + RAG Docs
                </span>
                <span className="text-[10px] text-zinc-400 block">Supabase pgvector</span>
              </div>
              <div className="p-4 rounded-xl bg-[#151B2A] border border-[#243048] space-y-1.5">
                <span className="text-emerald-400 font-bold block">4. Controlled Actions</span>
                <span className="text-zinc-400 text-[11px] font-sans block">
                  Human-in-the-Loop Approval
                </span>
                <span className="text-[10px] text-zinc-400 block">Audited Dispatch Logs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Grid */}
      <section className="py-16 px-6 border-b border-[#151C2C] max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Comprehensive Operational Capabilities
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            Everything payment engineering and merchant success teams require to manage operations reliably.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="p-5 rounded-xl bg-[#0D111A] border border-[#1C2538] space-y-3 hover:border-[#2E3C56] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-[#151B28] border border-[#222B3E] text-blue-400 group-hover:text-blue-300 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    {cap.tag}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
                  {cap.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {cap.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Footer Section */}
      <footer className="py-14 px-6 bg-[#06080C] text-center space-y-6">
        <div className="max-w-xl mx-auto space-y-3">
          <h3 className="text-xl font-bold text-white">
            Experience the Merchant Operations Copilot
          </h3>
          <p className="text-xs text-zinc-400">
            Inspect real-time telemetry on the dashboard or explore conversational operations inside the AI Copilot.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
            >
              Open Dashboard
            </Link>
            <Link
              href="/copilot"
              className="px-5 py-2.5 rounded-lg bg-[#141824] hover:bg-[#1C2232] text-zinc-300 text-xs font-medium border border-[#232B3E] transition-colors"
            >
              Try AI Copilot
            </Link>
          </div>
        </div>

        <div className="pt-8 border-t border-[#151B28] max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 gap-2">
          <span>AI Merchant Operations Copilot • Foundation & UI Shell</span>
          <span className="font-mono">Google Gemini • Vercel AI SDK • Next.js App Router</span>
        </div>
      </footer>
    </div>
  );
}
