import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { KPISection } from "@/components/dashboard/KPISection";
import { RevenueOverview } from "@/components/dashboard/RevenueOverview";
import { PaymentHealth } from "@/components/dashboard/PaymentHealth";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { RecentActionsSection } from "@/components/dashboard/RecentActionsSection";
import { CustomersSection } from "@/components/dashboard/CustomersSection";
import {
  getDashboardMetrics,
  getRevenueOverTime,
  getPaymentHealth as fetchPaymentHealth,
  getPaymentStatistics,
  getOperationalSignals,
  getRecentAgentActions,
  getCustomers,
} from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    metrics,
    revenueData,
    healthData,
    statistics,
    signals,
    recentActions,
    customers,
  ] = await Promise.all([
    getDashboardMetrics(),
    getRevenueOverTime(),
    fetchPaymentHealth(),
    getPaymentStatistics(),
    getOperationalSignals(),
    getRecentAgentActions(6),
    getCustomers(),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#090A0F]">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title="Merchant Operations"
          subtitle="Real-time payment telemetry, failure investigations & automated operations"
        />

        {/* Scrollable Dashboard View */}
        <main className="flex-1 overflow-y-auto p-6 space-y-10 scroll-smooth">
          {/* 1. OVERVIEW SECTION */}
          <section id="overview" aria-label="Operations Overview" className="space-y-6">
            <div className="border-b border-[#1A2233] pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Operations Overview & Telemetry
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Real-time volume velocity, rail success benchmarks, and automated operational risk signals
              </p>
            </div>

            {/* Top KPI Metrics */}
            <KPISection metrics={metrics} />

            {/* Revenue Velocity Chart */}
            <RevenueOverview
              revenueData={revenueData}
              statistics={statistics}
            />

            {/* Operational Signals / Signals */}
            <AIInsights signals={signals} />
          </section>

          {/* 2. PAYMENTS SECTION */}
          <section id="payments" aria-label="Payment Health by Rail" className="space-y-4 pt-2">
            <div className="border-b border-[#1A2233] pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Payment Methods & Rail Health
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Gateway success rates, transaction shares, and rail-specific failure categorizations (UPI, Card, Netbanking, Wallet)
              </p>
            </div>

            <PaymentHealth healthData={healthData} />
          </section>

          {/* 3. REFUNDS SECTION */}
          <section id="refunds" aria-label="Refunds & AI Actions Audit Trail" className="space-y-4 pt-2">
            <div className="border-b border-[#1A2233] pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Refund Operations & Action Audit Trail
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Immutable audit log of operator-authorized actions, refund triggers, and support escalations
              </p>
            </div>

            <RecentActionsSection actions={recentActions} />
          </section>

          {/* 4. CUSTOMERS SECTION */}
          <section id="customers" aria-label="Customer Risk & Friction Telemetry" className="space-y-4 pt-2">
            <div className="border-b border-[#1A2233] pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Customer Risk & Repeated Failure Operations
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Identification of high-friction customers, consecutive transaction drops, and recoverable revenue
              </p>
            </div>

            <CustomersSection customers={customers} />
          </section>
        </main>
      </div>
    </div>
  );
}
