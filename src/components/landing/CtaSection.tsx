import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { ROUTES } from "@/lib/constants";

export function CtaSection() {
  return (
    <section
      id="cta"
      aria-label="Call to action"
      className="py-32 px-6 lg:px-12 relative overflow-hidden"
    >
      {/* Primary-container background */}
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: "var(--color-primary-container)" }}
        aria-hidden="true"
      />
      {/* Edge gradient accent */}
      <div
        className="absolute top-0 right-0 w-1/3 h-full -z-10"
        style={{
          background: "linear-gradient(to left, rgba(0,0,0,0.18), transparent)",
        }}
        aria-hidden="true"
      />
      {/* Decorative blob */}
      <div
        className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl -z-10 opacity-40"
        style={{ backgroundColor: "var(--color-primary)" }}
        aria-hidden="true"
      />

      <div className="max-w-screen-xl mx-auto text-center" style={{ color: "var(--color-on-primary-container)" }}>
        <h2 className="text-4xl lg:text-6xl font-bold mb-8 leading-tight">
          Ready to transform
          <br />
          your daily journey?
        </h2>
        <p
          className="text-xl mb-12 max-w-2xl mx-auto"
          style={{ color: "rgba(216, 226, 255, 0.85)" }}
        >
          Join the EgooBus Network Today and experience the precision of concierge shuttle travel.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-5">
          <Link
            href={ROUTES.SIGN_UP}
            id="cta-get-started"
            className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-2xl font-bold text-xl transition-transform duration-150 hover:scale-105 active:scale-[0.97] shadow-2xl"
            style={{
              backgroundColor: "var(--color-on-primary-container)",
              color: "var(--color-primary-container)",
            }}
          >
            Get Started Now <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="mailto:sales@egoobus.com"
            id="cta-contact-sales"
            className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-2xl font-bold text-xl border-2 transition-all duration-150 hover:bg-white/10"
            style={{
              borderColor: "var(--color-on-primary-container)",
              color: "var(--color-on-primary-container)",
            }}
          >
            <MessageCircle className="w-5 h-5" />
            Contact Sales
          </a>
        </div>
      </div>
    </section>
  );
}
