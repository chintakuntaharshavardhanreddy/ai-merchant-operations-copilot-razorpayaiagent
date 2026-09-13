import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { CustomersSection } from "@/components/dashboard/CustomersSection";
import { getCustomers, getAllPayments } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const [customers, payments] = await Promise.all([
    getCustomers(),
    getAllPayments(),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#090A0F]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title="Customer Risk & Recovery"
          subtitle="Account friction analysis, repeated payment drop-offs, and non-destructive customer inspection"
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
          <section aria-label="Customer Risk Workspace">
            <CustomersSection customers={customers} payments={payments} />
          </section>
        </main>
      </div>
    </div>
  );
}
