import {
  IndianRupee,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function KPISection() {
  const kpis = [
    {
      title: "Total Revenue",
      value: "₹12.4L",
      subtitle: "vs ₹11.2L last 7 days",
      trend: "+10.7%",
      trendUp: true,
      icon: IndianRupee,
      badge: "Healthy",
      badgeVariant: "success" as const,
      description: "Net settled & authorized",
    },
    {
      title: "Payment Success Rate",
      value: "94.2%",
      subtitle: "Target: 95.0%",
      trend: "-0.8%",
      trendUp: false,
      icon: CheckCircle2,
      badge: "Benchmark 95%",
      badgeVariant: "warning" as const,
      description: "Across all checkout rails",
    },
    {
      title: "Failed Payments",
      value: "312",
      subtitle: "Out of 5,380 attempts",
      trend: "+14.2%",
      trendUp: false, // more failures is negative
      icon: XCircle,
      badge: "Investigation Needed",
      badgeVariant: "error" as const,
      description: "UPI & Bank downtime driven",
    },
    {
      title: "Revenue at Risk",
      value: "₹1.84L",
      subtitle: "Recoverable: ~₹1.12L",
      trend: "27 Users",
      trendUp: false,
      icon: AlertTriangle,
      badge: "Action Required",
      badgeVariant: "warning" as const,
      description: "Drop-offs & high-intent retry",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={kpi.title}
            className="relative overflow-hidden group hover:border-[#2C384F] transition-all bg-[#0D1017]"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-zinc-400">
                  {kpi.title}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-white font-mono">
                    {kpi.value}
                  </span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[#141A26] border border-[#20293D] text-zinc-300">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#182030] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                {kpi.trendUp ? (
                  <span className="flex items-center text-emerald-400 font-mono font-medium">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {kpi.trend}
                  </span>
                ) : (
                  <span className="flex items-center text-amber-400 font-mono font-medium">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    {kpi.trend}
                  </span>
                )}
                <span className="text-zinc-400 truncate max-w-[100px]">
                  {kpi.subtitle}
                </span>
              </div>
              <Badge variant={kpi.badgeVariant} size="sm">
                {kpi.badge}
              </Badge>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
