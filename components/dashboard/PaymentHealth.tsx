import {
  CreditCard,
  Smartphone,
  Landmark,
  Wallet,
  Activity,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { PaymentMethodHealth as MethodHealth } from "@/lib/db/queries";

const methodMeta: Record<
  string,
  {
    icon: typeof Smartphone;
    label: string;
  }
> = {
  UPI: { icon: Smartphone, label: "UPI" },
  CARD: { icon: CreditCard, label: "Cards" },
  NETBANKING: { icon: Landmark, label: "Netbanking" },
  WALLET: { icon: Wallet, label: "Wallets" },
};

function getStatus(rate: number): {
  label: string;
  variant: "success" | "warning" | "error";
} {
  if (rate >= 96) return { label: "Optimal", variant: "success" };
  if (rate >= 92) return { label: "Healthy", variant: "success" };
  if (rate >= 85) return { label: "Degraded", variant: "warning" };
  return { label: "Critical", variant: "error" };
}

interface PaymentHealthProps {
  healthData: MethodHealth[];
}

export function PaymentHealth({ healthData }: PaymentHealthProps) {
  return (
    <Card className="bg-[#0D1017]">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#1A2233]">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Payment Health & Rails</CardTitle>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <CardDescription>
            Live availability and failure metrics across major payment methods
          </CardDescription>
        </div>
        <Badge variant="neutral" size="sm">
          {healthData.length > 0 ? "Supabase" : "No Data"}
        </Badge>
      </CardHeader>

      <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthData.length === 0 && (
          <div className="col-span-full text-center text-zinc-400 text-sm py-8">
            No payment data available. Connect Supabase and seed the database.
          </div>
        )}
        {healthData.map((method) => {
          const meta = methodMeta[method.method] || {
            icon: CreditCard,
            label: method.method,
          };
          const Icon = meta.icon;
          const status = getStatus(method.successRate);

          return (
            <div
              key={method.method}
              className="p-4 rounded-xl bg-[#11151F] border border-[#1E2638] space-y-3 hover:border-[#2C384F] transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#181E2C] border border-[#232C3F] text-zinc-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-100">
                      {meta.label}
                    </h4>
                    <span className="text-[11px] text-zinc-400">
                      {method.share}% of volume
                    </span>
                  </div>
                </div>
                <Badge variant={status.variant} size="sm" dot>
                  {status.label}
                </Badge>
              </div>

              {/* Success Rate & Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Success Rate</span>
                  <span className="font-mono font-semibold text-zinc-100">
                    {method.successRate}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#1C2333] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      status.variant === "warning" || status.variant === "error"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                    style={{ width: `${Math.min(method.successRate, 100)}%` }}
                  />
                </div>
              </div>

              {/* Failures & Root Cause Note */}
              <div className="pt-2 border-t border-[#192131] space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    Failed
                  </span>
                  <span className="font-mono text-zinc-300">
                    {method.failedCount.toLocaleString("en-IN")}
                  </span>
                </div>
                {method.topFailureReason && (
                  <p className="text-zinc-400 text-[10px] leading-tight line-clamp-1 pt-0.5">
                    Top cause: {method.topFailureReason}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
