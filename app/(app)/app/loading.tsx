export default function AppOverviewLoading() {
  return (
    <main className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 space-y-8">
      <section className="panel-elevated relative overflow-hidden p-8">
        <div className="hairline-grid absolute inset-0 opacity-50" />
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.15fr)_340px]">
          <div className="space-y-4">
            <div className="h-6 w-48 rounded-full bg-white/[0.06]" />
            <div className="h-14 max-w-3xl rounded-3xl bg-white/[0.08]" />
            <div className="h-5 max-w-2xl rounded-full bg-white/[0.05]" />
            <div className="flex gap-3">
              <div className="h-11 w-36 rounded-full bg-white/[0.08]" />
              <div className="h-11 w-36 rounded-full bg-white/[0.05]" />
            </div>
          </div>
          <div className="panel-soft p-5">
            <div className="h-4 w-28 rounded-full bg-white/[0.05]" />
            <div className="mt-4 space-y-3">
              <div className="h-20 rounded-2xl bg-white/[0.04]" />
              <div className="h-20 rounded-2xl bg-white/[0.04]" />
              <div className="h-20 rounded-2xl bg-white/[0.04]" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="panel-soft h-28 p-5" />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
        <div className="panel-soft h-[360px] p-6" />
        <div className="space-y-6">
          <div className="panel-soft h-[280px] p-6" />
          <div className="panel-soft h-[220px] p-6" />
        </div>
      </section>
    </main>
  );
}
