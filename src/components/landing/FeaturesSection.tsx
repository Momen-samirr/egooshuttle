import Image from "next/image";
import { Map, Clock, Armchair, Zap } from "lucide-react";

/** The 8 passenger dot grid visual */
function PassengerDots() {
  return (
    <div className="hidden lg:flex items-center gap-3 flex-shrink-0" aria-label="8 passengers illustration">
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full shadow-lg"
            style={{
              backgroundColor: "var(--color-primary)",
              boxShadow: "0 4px 12px rgba(0,91,191,0.25)",
            }}
          />
        ))}
      </div>
      <Zap className="w-8 h-8 ml-3 flex-shrink-0" style={{ color: "var(--color-primary)" }} />
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section
      id="how-it-works"
      aria-label="Features"
      className="py-32 px-6 lg:px-12"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <h2 className="text-headline-sm mb-4" style={{ color: "var(--color-on-surface)" }}>
            Engineered for Reliability
          </h2>
          <p className="text-body-md" style={{ color: "var(--color-on-surface-variant)" }}>
            We&apos;ve replaced the chaos of ride-sharing with the precision of a concierge travel network.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Predefined Routes — wide card */}
          <div
            className="md:col-span-2 rounded-3xl p-10 flex flex-col justify-between overflow-hidden relative group"
            style={{ backgroundColor: "var(--color-surface-container-low)" }}
          >
            <div className="max-w-md relative z-10">
              <Map className="w-10 h-10 mb-6" style={{ color: "var(--color-primary)" }} aria-hidden="true" />
              <h3 className="text-title-md text-2xl font-bold mb-4" style={{ color: "var(--color-on-surface)" }}>
                Predefined Routes
              </h3>
              <p className="text-lg" style={{ color: "var(--color-on-surface-variant)" }}>
                Optimized pathways between residential hubs and major business districts. No erratic
                detours, just the fastest path to your destination.
              </p>
            </div>
            {/* Map image — peeks from bottom-right, animates on hover */}
            <div className="absolute right-0 bottom-0 w-1/2 translate-y-8 translate-x-8 group-hover:translate-y-4 group-hover:translate-x-4 transition-transform duration-500 pointer-events-none">
              <Image
                src="/images/route-map.png"
                alt="EgooBus digital city route map"
                width={400}
                height={300}
                className="rounded-tl-3xl shadow-2xl"
                loading="lazy"
              />
            </div>
          </div>

          {/* Scheduled Timing — primary card */}
          <div
            className="rounded-3xl p-10 flex flex-col"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Clock className="w-10 h-10 mb-6" style={{ color: "var(--color-primary-fixed)" }} aria-hidden="true" />
            <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--color-on-primary)" }}>
              Scheduled Timing
            </h3>
            <p className="text-lg" style={{ color: "rgba(216, 226, 255, 0.85)" }}>
              Predictability is a luxury. Our buses depart exactly when they say they will, allowing
              you to plan your morning to the minute.
            </p>
          </div>

          {/* Guaranteed Seats — white card */}
          <div
            className="rounded-3xl p-10 flex flex-col"
            style={{
              backgroundColor: "var(--color-surface-container-lowest)",
              boxShadow: "0 8px 32px rgba(24,28,32,0.06)",
            }}
          >
            <Armchair className="w-10 h-10 mb-6" style={{ color: "var(--color-secondary)" }} aria-hidden="true" />
            <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--color-on-surface)" }}>
              Guaranteed Seats
            </h3>
            <p className="text-lg" style={{ color: "var(--color-on-surface-variant)" }}>
              If you book it, it&apos;s yours. Every EgooBus passenger is guaranteed a spacious, ergonomic
              seat with high-speed Wi-Fi.
            </p>
          </div>

          {/* The 8+ Rule — wide card */}
          <div
            className="md:col-span-2 rounded-3xl p-10 flex items-center gap-10 overflow-hidden"
            style={{ backgroundColor: "var(--color-surface-container-highest)" }}
          >
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--color-on-surface)" }}>
                The 8+ Rule
              </h3>
              <p className="text-lg leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
                Our drivers only start their engines when a route reaches 8+ passengers. This ensures
                sustainable pricing and a consistent community of commuters.
              </p>
            </div>
            <PassengerDots />
          </div>
        </div>
      </div>
    </section>
  );
}
