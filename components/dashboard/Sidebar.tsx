"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  RotateCcw,
  Sparkles,
  Layers,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

type DashboardSectionId = "overview" | "payments" | "refunds" | "customers";

interface NavItem {
  id: DashboardSectionId | "copilot";
  name: string;
  href: string;
  icon: React.ElementType;
  highlight?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    name: "Overview",
    href: "/dashboard#overview",
    icon: LayoutDashboard,
  },
  {
    id: "payments",
    name: "Payments",
    href: "/dashboard#payments",
    icon: CreditCard,
  },
  {
    id: "refunds",
    name: "Refunds",
    href: "/dashboard#refunds",
    icon: RotateCcw,
  },
  {
    id: "customers",
    name: "Customers",
    href: "/dashboard#customers",
    icon: Users,
  },
  {
    id: "copilot",
    name: "AI Copilot",
    href: "/copilot",
    icon: Sparkles,
    highlight: true,
  },
];

export function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<DashboardSectionId>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "").toLowerCase() as DashboardSectionId;
      if (["overview", "payments", "refunds", "customers"].includes(hash)) {
        return hash;
      }
    }
    return "overview";
  });

  // Handle direct navigation scroll on mount (e.g. /dashboard#customers)
  useEffect(() => {
    if (typeof window === "undefined" || pathname !== "/dashboard") return;

    const hash = window.location.hash.replace("#", "").toLowerCase() as DashboardSectionId;
    if (["overview", "payments", "refunds", "customers"].includes(hash)) {
      const el = document.getElementById(hash);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    }
  }, [pathname]);

  // Listen to hash changes (e.g. browser forward/back buttons)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase() as DashboardSectionId;
      if (["overview", "payments", "refunds", "customers"].includes(hash)) {
        setActiveSection(hash);
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // IntersectionObserver to dynamically track visible section during manual scrolling
  useEffect(() => {
    if (typeof window === "undefined" || pathname !== "/dashboard") return;

    const sectionIds: DashboardSectionId[] = ["overview", "payments", "refunds", "customers"];
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the intersecting entry with the highest intersection ratio
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by intersection ratio or proximity to top
          const topEntry = visibleEntries.sort(
            (a, b) => b.intersectionRatio - a.intersectionRatio
          )[0];
          const id = topEntry.target.id as DashboardSectionId;
          setActiveSection(id);
          // Silently update hash in URL without triggering scrolling
          window.history.replaceState(null, "", `#${id}`);
        }
      },
      {
        rootMargin: "-15% 0px -50% 0px",
        threshold: [0.1, 0.25, 0.5],
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pathname]);

  const handleNavClick = useCallback(
    (e: React.MouseEvent, item: NavItem) => {
      setMobileOpen(false);

      if (item.id === "copilot") {
        return; // standard Next.js navigation
      }

      if (pathname === "/dashboard") {
        e.preventDefault();
        const sectionId = item.id as DashboardSectionId;
        setActiveSection(sectionId);
        window.history.replaceState(null, "", `#${sectionId}`);

        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    },
    [pathname]
  );

  const sidebarContent = (
    <>
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
          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-[#151922] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Operations Console
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isCopilot = item.id === "copilot";
            const isActive = isCopilot
              ? pathname === "/copilot"
              : pathname === "/dashboard" && activeSection === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                    : item.highlight
                    ? "text-blue-300 hover:bg-blue-500/10 hover:text-blue-200"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#131720]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
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
            <span className="text-zinc-300 font-mono text-[10px]">Gemini 2.5</span>
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
    </>
  );

  return (
    <>
      {/* Mobile hamburger trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#0A0C11] border border-[#1F2533] rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 border-r border-[#1F2533] bg-[#0A0C11] flex flex-col justify-between transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`w-64 border-r border-[#1F2533] bg-[#0A0C11] flex-col justify-between shrink-0 select-none hidden lg:flex ${className}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
