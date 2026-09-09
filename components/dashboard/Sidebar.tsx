"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  RotateCcw,
  ShieldAlert,
  BarChart3,
  Sparkles,
  Layers,
  ExternalLink,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      name: "Payments",
      href: "/dashboard#payments",
      icon: CreditCard,
      active: false,
    },
    {
      name: "Customers",
      href: "/dashboard#customers",
      icon: Users,
      active: false,
    },
    {
      name: "Refunds",
      href: "/dashboard#refunds",
      icon: RotateCcw,
      active: false,
    },
    {
      name: "Disputes",
      href: "/dashboard#disputes",
      icon: ShieldAlert,
      active: false,
    },
    {
      name: "Analytics",
      href: "/dashboard#analytics",
      icon: BarChart3,
      active: false,
    },
    {
      name: "AI Copilot",
      href: "/copilot",
      icon: Sparkles,
      active: pathname === "/copilot",
      highlight: true,
    },
  ];

  return (
    <aside
      className={`w-64 border-r border-[#1F2533] bg-[#0A0C11] flex flex-col justify-between shrink-0 select-none ${className}`}
    >
      <div>
        {/* Brand / Logo */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#1F2533]/80">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white block">
              Ops Copilot
            </span>
            <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase block">
              Merchant Core
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <div className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Operations Console
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  item.active
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                    : item.highlight
                    ? "text-blue-300 hover:bg-blue-500/10 hover:text-blue-200"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#131720]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      item.active
                        ? "text-blue-400"
                        : item.highlight
                        ? "text-blue-400"
                        : "text-zinc-400 group-hover:text-zinc-300"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.highlight && (
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono border border-blue-500/30">
                    AI
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer / System Status */}
      <div className="p-4 border-t border-[#1F2533]/80 bg-[#08090E]/50">
        <div className="p-3 rounded-lg bg-[#0F131C] border border-[#1C2333] space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">Gateway Engine</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Healthy
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">AI Reasoning</span>
            <span className="text-zinc-300 font-mono text-[10px]">Gemini Pro</span>
          </div>
          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 w-full pt-2 text-[11px] text-zinc-400 hover:text-zinc-200 border-t border-[#1A2130] transition-colors"
          >
            <span>Landing Overview</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
