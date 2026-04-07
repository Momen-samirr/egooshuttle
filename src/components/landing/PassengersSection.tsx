import { Smartphone, CreditCard } from "lucide-react";

const benefits = [
  {
    icon: Smartphone,
    iconBg: "var(--color-secondary-container)",
    iconColor: "var(--color-on-secondary-container)",
    title: "One-Tap Booking",
    description: "Reserve your weekly routes in seconds through our intuitive app.",
  },
  {
    icon: CreditCard,
    iconBg: "var(--color-secondary-container)",
    iconColor: "var(--color-on-secondary-container)",
    title: "Flexible Payments",
    description:
      "Pay your way. We support Visa/MasterCard, local Cash-at-boarding, and various mobile payment methods.",
  },
];

export function PassengersSection() {
  return (
    <section
      id="passengers"
      aria-label="For Passengers"
      className="py-24 px-6 lg:px-12"
      style={{ backgroundColor: "var(--color-surface-container-low)" }}
    >
      <div className="max-w-screen-xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
        {/* Image mosaic — reordered on mobile */}
        <div className="order-2 lg:order-1">
          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-2xl h-80 overflow-hidden mt-8"
              style={{ backgroundColor: "var(--color-surface-container-highest)" }}
            >
              {/* Passenger image placeholder — soft gradient */}
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #d8e2ff 0%, #ebeef4 100%)" }}
                role="img"
                aria-label="Professional woman working on laptop inside a premium shuttle bus"
              >
                <span className="text-4xl">🧑‍💼</span>
              </div>
            </div>
            <div
              className="rounded-2xl h-80 overflow-hidden"
              style={{ backgroundColor: "var(--color-surface-container-highest)" }}
            >
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #86f898 0%, #ebeef4 100%)" }}
                role="img"
                aria-label="Luxury shuttle bus interior with leather seats and soft lighting"
              >
                <span className="text-4xl">🚌</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copy */}
        <div className="order-1 lg:order-2">
          <span
            className="text-label-sm font-bold tracking-widest mb-4 block"
            style={{ color: "var(--color-secondary)" }}
          >
            For Passengers
          </span>
          <h2
            className="text-headline-sm text-4xl lg:text-5xl font-bold mb-8 leading-tight"
            style={{ color: "var(--color-on-surface)" }}
          >
            Your Commute,{" "}
            <br className="hidden sm:block" />
            Upgraded.
          </h2>

          <ul className="space-y-8" role="list">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <li key={benefit.title} className="flex gap-4">
                  <div
                    className="flex-none w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: benefit.iconBg,
                      color: benefit.iconColor,
                    }}
                    aria-hidden="true"
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3
                      className="font-bold text-lg mb-1"
                      style={{ color: "var(--color-on-surface)" }}
                    >
                      {benefit.title}
                    </h3>
                    <p className="text-body-md" style={{ color: "var(--color-on-surface-variant)" }}>
                      {benefit.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
