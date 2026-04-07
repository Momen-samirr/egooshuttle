interface NetworkStatusCardProps {
  activeTrips: number;
  onlineDrivers: number;
}

export function NetworkStatusCard({ activeTrips, onlineDrivers }: NetworkStatusCardProps) {
  return (
    <div
      className="md:col-span-2 relative overflow-hidden text-white p-8 rounded-3xl flex flex-col justify-between"
      style={{ backgroundColor: "var(--color-primary)" }}
    >
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

      <div className="z-10">
        <span className="text-xs font-bold tracking-widest uppercase opacity-80">
          Network Status
        </span>
        <h1 className="text-4xl font-black mt-2">Active Network</h1>
      </div>

      <div className="z-10 mt-12 grid grid-cols-2 gap-4">
        <div>
          <p className="text-4xl font-black">{activeTrips}</p>
          <p className="text-sm opacity-80">Trips currently in progress</p>
        </div>
        <div>
          <p className="text-4xl font-black">{onlineDrivers}</p>
          <p className="text-sm opacity-80">Drivers online</p>
        </div>
      </div>
    </div>
  );
}
