import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { IncidentHero } from "@/components/dashboard/IncidentHero";
import { KPISection } from "@/components/dashboard/KPISection";
import { RevenueOverview } from "@/components/dashboard/RevenueOverview";
import { AIInsights } from "@/components/dashboard/AIInsights";
import {
  getDashboardMetrics,
  getRevenueOverTime,
  getAllPeriodsRevenueData,
  getPaymentStatistics,
  getOperationalSignals,
} from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    metrics,
    revenueData,
    periodsData,
    statistics,
    signals,
  ] = await Promise.all([
    getDashboardMetrics(),
    getRevenueOverTime(),
    getAllPeriodsRevenueData(),
    getPaymentStatistics(),
    getOperationalSignals(),
  ]);

  const todaySummary = periodsData.today;
  const currentSettled = todaySummary.settledRevenue;
  const priorSettled =
    todaySummary.trendPercentage !== 0
      ? Math.round(currentSettled / (1 + todaySummary.trendPercentage / 100))
      : 206664;
  const currentAttempted = todaySummary.grossPaymentVolume;
  const grossTrend = todaySummary.grossTrendPercentage ?? 6.4;
  const priorAttempted =
    grossTrend !== 0
      ? Math.round(currentAttempted / (1 + grossTrend / 100))
      : 311929;

  return (
    <div className="flex h-screen overflow-hidden bg-[#090A0F]">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title="Operations Mission Control"
          subtitle="Real-time incident triage, payment velocity & automated risk telemetry"
        />

        {/* Scrollable Dashboard View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scroll-smooth">
          {/* 1. CRITICAL OPERATIONAL INCIDENT HERO */}
          <section aria-label="Critical Incident">
            <IncidentHero
              currentSettled={currentSettled}
              priorSettled={priorSettled}
              currentAttempted={currentAttempted}
              priorAttempted={priorAttempted}
              failedVolume={todaySummary.failedVolume}
              failedCount={todaySummary.failedTransactions ?? 43}
              repeatCustomersCount={metrics.repeatFailureCustomers}
              revenueAtRisk={metrics.revenueAtRisk}
            />
          </section>

          {/* 2. CORE FINANCIAL & OPERATIONAL VITAL METRICS */}
          <section aria-label="Core Financial Telemetry">
            <KPISection metrics={metrics} />
          </section>

          {/* 3. PAYMENT VELOCITY & SETTLEMENT CURVE */}
          <section aria-label="Payment Velocity Telemetry">
            <RevenueOverview
              revenueData={revenueData}
              statistics={statistics}
              periodsData={periodsData}
            />
          </section>

          {/* 4. ACTIVE OPERATIONAL SIGNALS */}
          <section aria-label="Active Operational Signals">
            <AIInsights signals={signals} />
          </section>
        </main>
      </div>
    </div>
  );
}
