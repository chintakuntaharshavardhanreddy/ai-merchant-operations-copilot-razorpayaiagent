"use client";

import Link from "next/link";
import { AlertTriangle, Sparkles, ArrowRight, Activity, Users } from "lucide-react";

interface IncidentHeroProps {
  currentSettled: number;
  priorSettled: number;
  currentAttempted: number;
  priorAttempted: number;
  failedVolume: number;
  failedCount: number;
  repeatCustomersCount: number;
  revenueAtRisk: number;
}

export function IncidentHero({
  currentSettled = 63908,
  priorSettled = 206664,
  currentAttempted = 331965,
  priorAttempted = 311929,
  failedVolume = 268057,
  failedCount = 43,
  repeatCustomersCount = 33,
  revenueAtRisk = 314200,
}: IncidentHeroProps) {
  // Exact percentage deltas
  const settledDelta =
    priorSettled > 0
      ? Math.round(((currentSettled - priorSettled) / priorSettled) * 1000) / 10
      : -69.1;
  const attemptedDelta =
    priorAttempted > 0
      ? Math.round(((currentAttempted - priorAttempted) / priorAttempted) * 1000) / 10
      : 6.4;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-[#0e121b] overflow-hidden">
      {/* Top Incident Header */}
      <div className="px-5 py-4 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-amber-500/[0.03]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
                Critical Incident
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                Active Telemetry Window (Last 24h)
              </span>
            </div>
            <h2 className="text-sm font-semibold text-zinc-100 mt-0.5">
              UPI Rail Authorization Failure Spike
            </h2>
          </div>
        </div>

        {/* Primary CTA */}
        <Link
          href="/copilot?q=Analyze%20UPI%20rail%20degradation%20and%20prepare%20customer%20recovery%20plan"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Investigate in Copilot</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Incident Narrative & Evidence Grid */}
      <div className="p-5 space-y-4">
        {/* Narrative Description */}
        <p className="text-xs text-zinc-300 leading-relaxed max-w-4xl">
          Settled revenue fell{" "}
          <strong className="text-amber-400 font-semibold tabular-nums">
            {settledDelta}%
          </strong>{" "}
          (₹{currentSettled.toLocaleString("en-IN")} vs. ₹
          {priorSettled.toLocaleString("en-IN")} in prior 24h) due to{" "}
          <strong className="text-zinc-100 font-semibold tabular-nums">
            {failedCount} UPI authentication drops
          </strong>
          , while customer payment attempt volume remained broadly stable (
          <span className="text-emerald-400 font-medium tabular-nums">
            +{attemptedDelta}%
          </span>
          , ₹{currentAttempted.toLocaleString("en-IN")} vs. ₹
          {priorAttempted.toLocaleString("en-IN")}).
        </p>

        {/* Quantified Evidence Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-white/[0.06]">
          <div className="p-2.5 rounded bg-[#090a0f] border border-white/[0.06]">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block">
              24h Failed Volume
            </span>
            <span className="text-base font-bold font-mono text-rose-400 mt-0.5 block tabular-nums">
              ₹{failedVolume.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {failedCount} dropped attempts
            </span>
          </div>

          <div className="p-2.5 rounded bg-[#090a0f] border border-white/[0.06]">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block">
              24h Settled Revenue
            </span>
            <span className="text-base font-bold font-mono text-zinc-100 mt-0.5 block tabular-nums">
              ₹{currentSettled.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-amber-400 font-mono">
              {settledDelta}% vs prior 24h
            </span>
          </div>

          <div className="p-2.5 rounded bg-[#090a0f] border border-white/[0.06]">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block">
              Attempted Demand
            </span>
            <span className="text-base font-bold font-mono text-zinc-200 mt-0.5 block tabular-nums">
              ₹{currentAttempted.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              +{attemptedDelta}% steady intent
            </span>
          </div>

          <div className="p-2.5 rounded bg-[#090a0f] border border-white/[0.06]">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block">
              Repeat Friction Pool
            </span>
            <span className="text-base font-bold font-mono text-amber-400 mt-0.5 block tabular-nums">
              {repeatCustomersCount} Accounts
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              ₹{revenueAtRisk.toLocaleString("en-IN")} at risk
            </span>
          </div>
        </div>

        {/* Operational Quick Actions */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs">
          <span className="text-[11px] font-mono text-zinc-400">
            Recommended Next Actions:
          </span>
          <Link
            href="/dashboard/payments"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#141a26] hover:bg-[#1a2334] text-zinc-200 border border-white/[0.08] transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>View Rail Diagnostics</span>
          </Link>
          <Link
            href="/dashboard/customers"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#141a26] hover:bg-[#1a2334] text-zinc-200 border border-white/[0.08] transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Triage {repeatCustomersCount} High-Friction Customers</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
