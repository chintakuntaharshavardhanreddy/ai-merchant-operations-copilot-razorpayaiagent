export default function DashboardLoading() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#090A0F]">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:flex w-64 border-r border-[#1F2533] bg-[#0A0C11] flex-col shrink-0">
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#1F2533]/80">
          <div className="w-8 h-8 rounded-lg bg-[#1A2030] animate-pulse" />
          <div className="space-y-1.5">
            <div className="w-20 h-3 rounded bg-[#1A2030] animate-pulse" />
            <div className="w-14 h-2 rounded bg-[#151B28] animate-pulse" />
          </div>
        </div>
        <div className="p-3 space-y-2 mt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-[#111520] animate-pulse" />
          ))}
        </div>
      </aside>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header skeleton */}
        <div className="h-16 border-b border-[#1F2533] bg-[#090A0F]/80 px-6 flex items-center justify-between shrink-0">
          <div className="space-y-1.5">
            <div className="w-48 h-4 rounded bg-[#1A2030] animate-pulse" />
            <div className="w-72 h-2.5 rounded bg-[#131820] animate-pulse" />
          </div>
          <div className="w-28 h-8 rounded-lg bg-[#141824] animate-pulse" />
        </div>

        {/* Dashboard content skeleton */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-[#0D1017] border border-[#1A2233] animate-pulse"
              />
            ))}
          </div>

          {/* Revenue Chart */}
          <div className="h-72 rounded-xl bg-[#0D1017] border border-[#1A2233] animate-pulse" />

          {/* Payment Health */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-xl bg-[#0D1017] border border-[#1A2233] animate-pulse"
              />
            ))}
          </div>

          {/* Operational Signals */}
          <div className="h-40 rounded-xl bg-[#0D1017] border border-[#1A2233] animate-pulse" />

          {/* Customers Section Skeleton */}
          <div className="h-64 rounded-xl bg-[#0D1017] border border-[#1A2233] animate-pulse" />
        </main>
      </div>
    </div>
  );
}
