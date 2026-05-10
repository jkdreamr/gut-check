export default function PeopleLoading() {
  return (
    <main className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 space-y-6">
      <div className="panel-elevated p-6">
        <div className="h-4 w-28 rounded-full bg-white/[0.05]" />
        <div className="mt-3 h-10 max-w-2xl rounded-2xl bg-white/[0.08]" />
        <div className="mt-2 h-4 max-w-xl rounded-full bg-white/[0.05]" />
        <div className="mt-5 flex flex-col gap-3 lg:flex-row">
          <div className="h-12 flex-1 rounded-[18px] bg-white/[0.05]" />
          <div className="h-12 w-36 rounded-full bg-white/[0.08]" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="panel-soft h-[280px] p-5" />
        ))}
      </div>
    </main>
  );
}
