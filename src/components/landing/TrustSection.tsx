import { ShieldCheck, Activity } from "lucide-react";

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Vetted Professionals",
    description:
      "Every driver undergoes a rigorous background check and vehicle safety inspection before joining.",
    id: "trust-vetted",
  },
  {
    icon: Activity,
    title: "Real-time Monitoring",
    description:
      "Our 24/7 operations center tracks every bus to ensure on-time performance and passenger safety.",
    id: "trust-monitoring",
  },
];

export function TrustSection() {
  return (
    <section
      id="safety"
      aria-label="Trust and Safety"
      className="py-24 px-6 lg:px-12"
      style={{ backgroundColor: "var(--color-on-surface)" }}
    >
      <div className="max-w-screen-xl mx-auto grid lg:grid-cols-3 gap-12">
        {/* Headline */}
        <div className="lg:col-span-1">
          <h2 className="text-4xl font-bold mb-6 text-white leading-tight">
            Built on{" "}
            <br />
            Unwavering Trust.
          </h2>
          <p className="text-lg" style={{ color: "rgba(223, 227, 232, 0.7)" }}>
            Safety isn&apos;t a feature; it&apos;s the foundation of every trip we authorize.
          </p>
        </div>

        {/* Trust cards */}
        <div className="lg:col-span-2 grid md:grid-cols-2 gap-8">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.id}
                id={item.id}
                className="p-8 rounded-2xl"
                style={{ border: "1px solid rgba(223, 227, 232, 0.1)" }}
              >
                <Icon
                  className="w-10 h-10 mb-6"
                  style={{ color: "var(--color-primary-fixed)" }}
                  aria-hidden="true"
                />
                <h3 className="text-xl font-bold mb-3 text-white">{item.title}</h3>
                <p style={{ color: "rgba(223, 227, 232, 0.7)" }}>{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
