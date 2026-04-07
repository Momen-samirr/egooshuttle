import { CreditCard, Banknote, Building2 } from "lucide-react";

const paymentMethods = [
  {
    icon: CreditCard,
    iconBg: "rgba(0, 91, 191, 0.1)",
    iconColor: "var(--color-primary)",
    title: "Visa & MasterCard",
    description:
      "Secure, instant payments via all major international debit and credit cards.",
    badges: ["Visa", "MasterCard"],
    id: "payment-card",
  },
  {
    icon: Banknote,
    iconBg: "rgba(0, 110, 44, 0.1)",
    iconColor: "var(--color-secondary)",
    title: "On-Board Cash",
    description:
      "Prefer the traditional way? Pay in cash directly to our concierge when boarding your shuttle.",
    badges: ["Cash (On-Board)"],
    id: "payment-cash",
  },
  {
    icon: Building2,
    iconBg: "rgba(158, 67, 0, 0.1)",
    iconColor: "var(--color-tertiary)",
    title: "Local Payments",
    description:
      "Integrated with local mobile money and regional bank transfer options for your convenience.",
    badges: ["Mobile Money", "Bank Transfer"],
    id: "payment-local",
  },
];

export function PaymentsSection() {
  return (
    <section
      id="payments"
      aria-label="Payment options"
      className="py-24 px-6 lg:px-12"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="text-headline-sm mb-4"
            style={{ color: "var(--color-on-surface)" }}
          >
            Flexible Payment Options
          </h2>
          <p className="text-body-md max-w-2xl mx-auto" style={{ color: "var(--color-on-surface-variant)" }}>
            Choose the way you want to pay. We support a variety of methods to make your booking as
            seamless as your ride.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <article
                key={method.id}
                id={method.id}
                className="p-8 rounded-3xl transition-shadow duration-200 hover:shadow-ambient"
                style={{
                  backgroundColor: "var(--color-surface-container-low)",
                  /* No explicit border — tonal layering per DESIGN.md §2 */
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: method.iconBg, color: method.iconColor }}
                  aria-hidden="true"
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3
                  className="text-title-md font-bold mb-3"
                  style={{ color: "var(--color-on-surface)" }}
                >
                  {method.title}
                </h3>
                <p className="text-body-md mb-6" style={{ color: "var(--color-on-surface-variant)" }}>
                  {method.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {method.badges.map((badge) => (
                    <span
                      key={badge}
                      className="px-3 py-1 rounded-lg text-label-sm font-bold"
                      style={{
                        backgroundColor: "var(--color-surface-container-highest)",
                        color: "var(--color-on-surface-variant)",
                      }}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
