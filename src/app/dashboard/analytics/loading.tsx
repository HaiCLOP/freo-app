export default function AnalyticsLoading() {
  return (
    <div
      className="min-h-full -m-6 md:-m-10 p-6 md:p-10"
      style={{ backgroundColor: "#0b0b0b" }}
    >
      <div className="max-w-[1200px] mx-auto space-y-10 animate-pulse pb-10">
        <div>
          <div className="h-3 w-16 rounded mb-4" style={{ backgroundColor: "#191919" }} />
          <div className="h-12 w-56 rounded-xl mb-3" style={{ backgroundColor: "#131313" }} />
          <div className="h-4 w-72 rounded-lg" style={{ backgroundColor: "#131313" }} />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 h-32"
              style={{ backgroundColor: "#131313" }}
            >
              <div className="h-3 w-20 rounded mb-4" style={{ backgroundColor: "#191919" }} />
              <div className="h-7 w-16 rounded-lg mb-3" style={{ backgroundColor: "#191919" }} />
              <div className="h-2.5 w-24 rounded" style={{ backgroundColor: "#191919" }} />
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl h-60" style={{ backgroundColor: "#131313" }} />
          <div className="rounded-2xl h-60" style={{ backgroundColor: "#131313" }} />
        </div>
      </div>
    </div>
  );
}
