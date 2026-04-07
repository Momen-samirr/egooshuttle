export function TripRouteMapCard() {
  return (
    <div className="rounded-xl overflow-hidden relative group shadow-ambient"
      style={{ backgroundColor: "var(--color-surface-container-lowest)" }}>
      {/* Live badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
          style={{ color: "var(--color-primary)" }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: "var(--color-primary)" }} />
            <span className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: "var(--color-primary)" }} />
          </span>
          Live Route
        </div>
      </div>

      {/* Map placeholder — dark themed */}
      <div className="w-full h-64 relative overflow-hidden" style={{ backgroundColor: "#1a1e2e" }}>
        {/* Grid pattern to simulate a map */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
        {/* Simulated route line */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 256" fill="none">
          <path
            d="M60 200 C120 180, 160 80, 200 100 C240 120, 280 60, 340 50"
            stroke="var(--color-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="8 4"
            opacity="0.8"
          />
          <circle cx="60" cy="200" r="6" fill="var(--color-primary)" />
          <circle cx="60" cy="200" r="10" fill="var(--color-primary)" opacity="0.2" />
          <circle cx="340" cy="50" r="6" fill="var(--color-secondary)" />
          <circle cx="340" cy="50" r="10" fill="var(--color-secondary)" opacity="0.2" />
        </svg>
      </div>

      {/* Footer */}
      <div className="p-4" style={{ backgroundColor: "var(--color-surface-container-lowest)" }}>
        <div className="flex justify-between items-center text-sm">
          <span style={{ color: "var(--color-on-surface-variant)" }}>Estimated Travel Time</span>
          <span className="font-bold">45 mins</span>
        </div>
      </div>
    </div>
  );
}
