"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  RotateCcw,
  Sparkles,
  Layers,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
  isExact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    isExact: true,
  },
  {
    id: "payments",
    name: "Payments & Rails",
    href: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    id: "refunds",
    name: "Refunds & Audit",
    href: "/dashboard/refunds",
    icon: RotateCcw,
  },
  {
    id: "customers",
    name: "Customer Risk",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    id: "copilot",
    name: "AI Copilot",
    href: "/copilot",
    icon: Sparkles,
  },
];

export function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isItemActive = (item: NavItem) => {
    if (item.isExact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand / Workspace Header */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-white/[0.08]">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-tight text-white block">
                Ops Copilot
              </span>
              <span className="text-[10px] text-zinc-400 font-mono uppercase block -mt-0.5">
                Merchant Core
              </span>
            </div>
          </Link>

          {/* Mobile Close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-white/[0.04]"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Navigation */}
        <div className="p-3 space-y-0.5">
          <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Workspaces
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);
            const isCopilot = item.id === "copilot";

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors group ${
                  active
                    ? "bg-white/[0.06] text-white font-medium border-l-2 border-blue-500 rounded-l-none"
                    : isCopilot
                    ? "text-blue-400 hover:bg-blue-500/[0.06] hover:text-blue-300"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      active
                        ? "text-blue-400"
                        : isCopilot
                        ? "text-blue-400"
                        : "text-zinc-400 group-hover:text-zinc-300"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {isCopilot && (
                  <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 px-1 py-0.5 rounded border border-blue-500/20">
                    AI
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* System Status Footer */}
      <div className="p-3.5 border-t border-white/[0.08] bg-[#07080c] space-y-2">
        <div className="px-1 text-[11px] space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-zinc-400">
            <span>Database</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Connected
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>AI Agent</span>
            <span className="text-zinc-300">Active</span>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-300 pt-2 border-t border-white/[0.04] transition-colors"
        >
          <span>Landing Overview</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3.5 left-3.5 z-40 p-1.5 bg-[#0e121b] border border-white/[0.08] rounded-md text-zinc-300"
        aria-label="Open Navigation"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-56 border-r border-white/[0.08] bg-[#090a0f] transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Persistent Rail */}
      <aside
        className={`w-56 border-r border-white/[0.08] bg-[#090a0f] shrink-0 select-none hidden lg:block ${className}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
