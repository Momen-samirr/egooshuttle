import Image from "next/image";
import Link from "next/link";
import { TrendingUp, Wallet, ArrowRight } from "lucide-react";
import { ROUTES } from "@/lib/constants";

const driverPerks = [
  {
    icon: TrendingUp,
    label: "Guaranteed Full Loads",
    badge: "8+ Passenger Min",
    id: "perk-loads",
  },
  {
    icon: Wallet,
    label: "Weekly Payouts",
    badge: "Top Tier Rates",
    id: "perk-payouts",
  },
];

export function DriversSection() {
  return (
    <section
      id="drivers"
      aria-label="For Drivers"
      className="py-24 px-6 lg:px-12"
      style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
    >
      <div className="max-w-screen-xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
        {/* Copy */}
        <div>
          <span
            className="text-label-sm font-bold tracking-widest mb-4 block"
            style={{ color: "var(--color-primary)" }}
          >
            For Drivers
          </span>
          <h2
            className="text-4xl lg:text-5xl font-bold mb-8 leading-tight"
            style={{ color: "var(--color-on-surface)" }}
          >
            Scale Your{" "}
            <br className="hidden sm:block" />
            Earnings.
          </h2>
          <p className="text-lg leading-relaxed mb-10" style={{ color: "var(--color-on-surface-variant)" }}>
            Join the elite EgooBus fleet. We provide the routes and the demand; you provide the
            premium service.
          </p>

          {/* Perk cards */}
          <div className="space-y-4 mb-10">
            {driverPerks.map((perk) => {
              const Icon = perk.icon;
              return (
                <div
                  key={perk.id}
                  id={perk.id}
                  className="p-5 rounded-2xl flex items-center justify-between"
                  style={{ backgroundColor: "var(--color-surface-container-low)" }}
                >
                  <div className="flex items-center gap-4">
                    <Icon className="w-7 h-7 flex-shrink-0" style={{ color: "var(--color-primary)" }} aria-hidden="true" />
                    <span className="font-bold text-lg" style={{ color: "var(--color-on-surface)" }}>
                      {perk.label}
                    </span>
                  </div>
                  <span
                    className="text-label-sm font-bold px-3 py-1 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: "var(--color-primary-fixed)",
                      color: "var(--color-on-primary-fixed-variant)",
                    }}
                  >
                    {perk.badge}
                  </span>
                </div>
              );
            })}
          </div>

          {/* CTA link */}
          <Link
            href={ROUTES.DRIVER}
            id="driver-apply-cta"
            className="inline-flex items-center gap-2 font-bold transition-all duration-150 hover:gap-4 group"
            style={{ color: "var(--color-primary)" }}
          >
            Driver Application Process
            <ArrowRight className="w-5 h-5 transition-transform duration-150 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Driver image */}
        <div className="relative">
          {/* Subtle background tilt */}
          <div
            className="absolute inset-0 rounded-3xl -rotate-3 scale-105"
            style={{ backgroundColor: "rgba(0, 91, 191, 0.05)" }}
            aria-hidden="true"
          />
          <Image
            src="/images/driver.png"
            alt="Professional EgooBus driver in uniform standing next to a premium shuttle coach"
            width={600}
            height={500}
            className="relative rounded-3xl w-full h-[500px] object-cover shadow-[0_8px_32px_rgba(24,28,32,0.12)]"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
