import Link from "next/link";
import { Sparkles, Building2 } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({
  title = "Merchant Operations",
  subtitle = "Real-time payment analytics, failure investigations & automated operations",
}: HeaderProps) {
  return (
    <header className="h-14 border-b border-white/[0.08] bg-[#090a0f] px-5 sm:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
      <div className="flex items-center space-x-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">
              {title}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono text-zinc-400 bg-zinc-900 border border-white/[0.06]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              AI Agent Online
            </span>
          </div>
          {subtitle && (
            <p className="text-[11px] text-zinc-400 hidden sm:block mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2.5">
        {/* Merchant Workspace Context */}
        <div className="hidden md:flex items-center gap-2 bg-[#0e121b] border border-white/[0.08] rounded-md px-2.5 py-1 text-xs text-zinc-300">
          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-medium text-zinc-200">Apex Retail Group</span>
          <span className="text-[10px] text-zinc-400 font-mono">
            LIVE
          </span>
        </div>

        {/* Command Palette Trigger */}
        <Link
          href="/copilot"
          className="flex items-center gap-2 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-[#0e121b] hover:bg-[#141a26] border border-white/[0.08] rounded-md transition-colors"
          title="Open Copilot Terminal (⌘K)"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Copilot</span>
          <kbd className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1 py-0.5 rounded border border-white/[0.08]">
            ⌘K
          </kbd>
        </Link>
      </div>
    </header>
  );
}
