import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { KPISection } from "@/components/dashboard/KPISection";
import { RevenueOverview } from "@/components/dashboard/RevenueOverview";
import { PaymentHealth } from "@/components/dashboard/PaymentHealth";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { RecentActionsSection } from "@/components/dashboard/RecentActionsSection";
import {
  getDashboardMetrics,
  getRevenueOverTime,
  getPaymentHealth as fetchPaymentHealth,
  getPaymentStatistics,
  getOperationalSignals,
  getRecentAgentActions,
} from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [metrics, revenueData, healthData, statistics, signals, recentActions] =
    await Promise.all([
      getDashboardMetrics(),
      getRevenueOverTime(),
      fetchPaymentHealth(),
      getPaymentStatistics(),
      getOperationalSignals(),
      getRecentAgentActions(6),
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
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top KPI Metrics */}
          <section id="analytics" aria-label="Key Performance Indicators">
            <KPISection metrics={metrics} />
          </section>

          {/* Revenue Velocity Chart */}
          <section aria-label="Revenue Overview">
            <RevenueOverview
              revenueData={revenueData}
              statistics={statistics}
            />
          </section>

          {/* Payment Method Health */}
          <section id="payments" aria-label="Payment Health by Rail">
            <PaymentHealth healthData={healthData} />
          </section>

          {/* Operational Insights / Disputes */}
          <section id="disputes" aria-label="Operational Signals">
            <AIInsights signals={signals} />
          </section>

          {/* AI Actions & Audit Trail / Refunds */}
          <section id="refunds" aria-label="Recent AI Actions & Audit Trail">
            <RecentActionsSection actions={recentActions} />
          </section>

          {/* Customers anchor — scrolls to KPI section which contains customer metrics */}
          <div id="customers" className="sr-only" />
        </main>
      </div>
    </div>
  );
}
