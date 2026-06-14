export default function AnalyticsLoading() {
  return (
    <div className="space-y-10 animate-pulse pb-10">
      <div>
        <div className="h-10 w-48 bg-gray-200 rounded-xl mb-3" />
        <div className="h-5 w-72 bg-gray-100 rounded-lg" />
      </div>
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-[24px] border border-[#f5f5f7] bg-white p-7 h-36"
          >
            <div className="h-4 w-28 bg-gray-100 rounded mb-4" />
            <div className="h-8 w-20 bg-gray-200 rounded-lg mb-3" />
            <div className="h-3 w-32 bg-gray-50 rounded" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-[24px] border border-[#f5f5f7] bg-white h-64" />
        <div className="rounded-[24px] border border-[#f5f5f7] bg-white h-64" />
      </div>
    </div>
  );
}
