import Link from "next/link";
import {
  CreditCard,
  Smartphone,
  Landmark,
  Wallet,
  Activity,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import type { PaymentMethodHealth as MethodHealth } from "@/lib/db/queries";

const methodMeta: Record<
  string,
  {
    icon: typeof Smartphone;
    label: string;
    description: string;
  }
> = {
  UPI: {
    icon: Smartphone,
    label: "UPI Rail",
    description: "Instant real-time payment protocol (VPA / QR)",
  },
  CARD: {
    icon: CreditCard,
    label: "Cards (Debit/Credit)",
    description: "Visa, Mastercard, RuPay & network tokenization",
  },
  NETBANKING: {
    icon: Landmark,
    label: "Netbanking",
    description: "Direct bank gateway authentication (NB)",
  },
  WALLET: {
    icon: Wallet,
    label: "Wallets & PPI",
    description: "Prepaid instruments & partner wallets",
  },
};

function getSeverityBadge(severity?: string, rate?: number) {
  if (severity === "critical" || (rate && rate < 65)) {
    return {
      label: "Critical Degradation",
      badgeClass: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      barClass: "bg-rose-500",
      dotClass: "bg-rose-500 animate-pulse",
    };
  }
  if (severity === "degraded" || (rate && rate < 75)) {
    return {
      label: "Performance Degraded",
      badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      barClass: "bg-amber-400",
      dotClass: "bg-amber-400",
    };
  }
  if (severity === "monitored" || (rate && rate < 85)) {
    return {
      label: "Monitored Rail",
      badgeClass: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      barClass: "bg-blue-400",
      dotClass: "bg-blue-400",
    };
  }
  return {
    label: "Healthy",
    badgeClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    barClass: "bg-emerald-400",
    dotClass: "bg-emerald-400",
  };
}

interface PaymentHealthProps {
  healthData: MethodHealth[];
}

export function PaymentHealth({ healthData }: PaymentHealthProps) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6 backdrop-blur-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
              Payment Rail Health & Telemetry
            </h2>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time authorization reliability, volume distribution, and failure root causes per rail
          </p>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 self-start sm:self-auto px-2.5 py-1 rounded-full bg-zinc-950/60 border border-zinc-800/80">
          {healthData.length} active rails monitored
        </span>
      </div>

      {/* Rails Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthData.length === 0 && (
          <div className="col-span-full text-center text-zinc-400 text-sm py-12">
            No payment rail telemetry available.
          </div>
        )}
        {healthData.map((method) => {
          const meta = methodMeta[method.method] || {
            icon: CreditCard,
            label: method.method,
            description: "Payment channel",
          };
          const Icon = meta.icon;
          const severityInfo = getSeverityBadge(method.severity, method.successRate);

          return (
            <div
              key={method.method}
              className="rounded-xl bg-zinc-950/40 border border-zinc-800/60 p-4 space-y-3.5 hover:border-zinc-700/80 transition-all duration-150 flex flex-col justify-between"
            >
              <div>
                {/* Rail Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/80 text-zinc-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">{meta.label}</h3>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {method.share}% volume share
                      </span>
                    </div>
                  </div>
                </div>

                {/* Severity Status Badge */}
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-medium font-mono px-2 py-0.5 rounded-full border ${severityInfo.badgeClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${severityInfo.dotClass}`} />
                    {severityInfo.label}
                  </span>
                </div>

                {/* Success Rate Bar */}
                <div className="space-y-1.5 pt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Success Rate</span>
                    <span className="font-mono font-semibold text-zinc-100">
                      {method.successRate}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${severityInfo.barClass}`}
                      style={{ width: `${Math.min(method.successRate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Volume & Failure Root Cause */}
                <div className="pt-3 border-t border-zinc-800/60 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Failed Attempts:</span>
                    <span className="font-mono font-medium text-rose-400">
                      {method.failedCount.toLocaleString("en-IN")} / {method.totalCount}
                    </span>
                  </div>
                  {method.topFailureReason && (
                    <div className="flex items-start gap-1.5 text-[11px] text-zinc-400">
                      <AlertCircle className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        Primary: <span className="text-zinc-300 font-mono">{method.topFailureReason}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Link: Investigate Rail */}
              <div className="pt-2 border-t border-zinc-800/40">
                <Link
                  href={`/copilot?q=Analyze%20${method.method}%20rail%20degradation,%20failure%20codes,%20and%20remediation%20options`}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors font-medium group"
                >
                  <span>Investigate Rail</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
