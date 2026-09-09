import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { KPISection } from "@/components/dashboard/KPISection";
import { RevenueOverview } from "@/components/dashboard/RevenueOverview";
import { PaymentHealth } from "@/components/dashboard/PaymentHealth";
import { AIInsights } from "@/components/dashboard/AIInsights";

export default function DashboardPage() {
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
          <section aria-label="Key Performance Indicators">
            <KPISection />
          </section>

          {/* Revenue Velocity Chart */}
          <section aria-label="Revenue Overview">
            <RevenueOverview />
          </section>

          {/* Payment Method Health */}
          <section aria-label="Payment Health by Rail">
            <PaymentHealth />
          </section>

          {/* AI Operational Insights */}
          <section aria-label="AI Anomaly Detection and Insights">
            <AIInsights />
          </section>
        </main>
      </div>
    </div>
  );
}
