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

export function PaymentHealth() {
  const paymentMethods = [
    {
      name: "UPI",
      icon: Smartphone,
      share: "58% of volume",
      successRate: "91.8%",
      latency: "3.8s",
      status: "Degraded",
      statusVariant: "warning" as const,
      statusDesc: "SBI & HDFC gateway response delay",
      progress: 91.8,
    },
    {
      name: "Cards",
      icon: CreditCard,
      share: "26% of volume",
      successRate: "96.1%",
      latency: "1.2s",
      status: "Optimal",
      statusVariant: "success" as const,
      statusDesc: "Visa/Mastercard 3DS2 running smooth",
      progress: 96.1,
    },
    {
      name: "Netbanking",
      icon: Landmark,
      share: "11% of volume",
      successRate: "95.4%",
      latency: "2.1s",
      status: "Healthy",
      statusVariant: "success" as const,
      statusDesc: "Normal bank router operations",
      progress: 95.4,
    },
    {
      name: "Wallets",
      icon: Wallet,
      share: "5% of volume",
      successRate: "98.2%",
      latency: "0.8s",
      status: "Optimal",
      statusVariant: "success" as const,
      statusDesc: "Instant tokenized settlements",
      progress: 98.2,
    },
  ];

  return (
    <Card className="bg-[#0D1017]">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#1A2233]">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Payment Health & Rails</CardTitle>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <CardDescription>
            Live availability and latency metrics across major payment methods
          </CardDescription>
        </div>
        <Badge variant="neutral" size="sm">
          Updated 1m ago
        </Badge>
      </CardHeader>

      <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          return (
            <div
              key={method.name}
              className="p-4 rounded-xl bg-[#11151F] border border-[#1E2638] space-y-3 hover:border-[#2C384F] transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#181E2C] border border-[#232C3F] text-zinc-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-100">
                      {method.name}
                    </h4>
                    <span className="text-[11px] text-zinc-400">
                      {method.share}
                    </span>
                  </div>
                </div>
                <Badge variant={method.statusVariant} size="sm" dot>
                  {method.status}
                </Badge>
              </div>

              {/* Success Rate & Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Success Rate</span>
                  <span className="font-mono font-semibold text-zinc-100">
                    {method.successRate}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#1C2333] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      method.status === "Degraded"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                    style={{ width: `${method.progress}%` }}
                  />
                </div>
              </div>

              {/* Latency & Root Cause Note */}
              <div className="pt-2 border-t border-[#192131] space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    Latency
                  </span>
                  <span className="font-mono text-zinc-300">{method.latency}</span>
                </div>
                <p className="text-zinc-400 text-[10px] leading-tight line-clamp-1 pt-0.5">
                  {method.statusDesc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
