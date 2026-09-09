import Link from "next/link";
import { Bell, Sparkles, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({
  title = "Merchant Operations",
  subtitle = "Real-time payment analytics, failure investigations & automated operations",
}: HeaderProps) {
  return (
    <header className="h-16 border-b border-[#1F2533] bg-[#090A0F]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-zinc-100 tracking-tight">
              {title}
            </h1>
            <Badge variant="success" size="sm" dot>
              AI Online
            </Badge>
          </div>
          {subtitle && (
            <p className="text-xs text-zinc-400 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Merchant Account Picker */}
        <div className="hidden md:flex items-center gap-2 bg-[#12161F] border border-[#202738] rounded-lg px-3 py-1.5 text-xs text-zinc-300">
          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-medium">Apex Retail Group</span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/20 font-mono">
            LIVE
          </span>
        </div>

        {/* Quick Link to Copilot */}
        <Link
          href="/copilot"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 rounded-lg transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch Copilot</span>
        </Link>

        {/* Notification Bell */}
        <button
          className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-[#151922] rounded-lg transition-colors border border-transparent hover:border-[#202738] relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-[#090A0F]" />
        </button>
      </div>
    </header>
  );
}
