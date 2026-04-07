"use client";

import { useGoogleAuth } from "@/features/auth/hooks/useGoogleAuth";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Bus, Users } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type RoleSelection = "customer" | "driver";

const ROLES: {
  value: RoleSelection;
  label: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  ctaLabel: string;
}[] = [
  {
    value: "driver",
    label: "Driver",
    description:
      "Access route schedules, real-time navigation, and passenger manifests to ensure a smooth journey.",
    icon: Bus,
    iconBg: "#d8e2ff",
    iconColor: "#005bbf",
    ctaLabel: "Select Driver",
  },
  {
    value: "customer",
    label: "Client",
    description:
      "Track your bus in real-time, view schedules, and manage your trips easily.",
    icon: Users,
    iconBg: "#86f898",
    iconColor: "#006e2c",
    ctaLabel: "Select Client",
  },
];

export default function RoleSetupPage() {
  const { appUser } = useGoogleAuth();
  const router = useRouter();

  const updateProfile = useMutation(api.users.updateProfile);

  const [selectedRole, setSelectedRole] = useState<RoleSelection>("customer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Still loading the session
  if (!appUser) {
    return (
      <main className="flex-grow flex items-center justify-center min-h-screen bg-[#f7f9ff]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </main>
    );
  }

  const handleContinue = async () => {
    try {
      setIsSubmitting(true);

      if (selectedRole === "driver") {
        await updateProfile({
          role: selectedRole,
          isOnboarded: true,
        });
        router.push(ROUTES.DRIVER);
      } else {
        // customer — continues to location preferences (Step 3)
        await updateProfile({
          role: selectedRole,
        });
        router.push(ROUTES.ONBOARDING_LOCATION);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update role. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-16 px-6 bg-[#f7f9ff] min-h-screen">
      <div className="max-w-5xl w-full">
        {/* Heading Section */}
        <div className="text-center mb-12">
          {/* Progress Indicator */}
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="h-1 w-16 rounded-full bg-[#1a73e8]" />
            <div className="h-1 w-16 rounded-full bg-[#1a73e8]" />
            <div className="h-1 w-16 rounded-full bg-[#dfe3e8]" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#181c20] mb-4">
            Choose your role to get started
          </h1>
          <p className="text-[#414754] text-base md:text-lg max-w-md mx-auto">
            Select how you will be using the EgooBus platform to customize your
            experience.
          </p>
        </div>

        {/* Role Selection Grid — 2 columns (Driver & Client only) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.value;
            return (
              <div
                key={role.value}
                id={`role-card-${role.value}`}
                onClick={() => setSelectedRole(role.value)}
                className={cn(
                  "group relative bg-white rounded-xl p-8 cursor-pointer shadow-[0_8px_32px_rgba(24,28,32,0.06)] hover:bg-[#ebeef4] transition-all duration-300 border-2",
                  isSelected
                    ? "border-[#005bbf] bg-[#005bbf]/5 ring-2 ring-[#005bbf]"
                    : "border-transparent"
                )}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 bg-[#005bbf] text-white rounded-full p-1 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}

                <div className="flex flex-col h-full">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: role.iconBg }}
                  >
                    <Icon
                      className="w-8 h-8"
                      style={{ color: role.iconColor }}
                    />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#181c20] mb-3">
                    {role.label}
                  </h2>
                  <p className="text-[#414754] text-base mb-8 leading-relaxed">
                    {role.description}
                  </p>

                  <div className="mt-auto flex items-center text-[#005bbf] font-semibold text-sm">
                    <span>{role.ctaLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Action */}
        <div className="flex flex-col items-center gap-6">
          <button
            id="role-continue-btn"
            disabled={isSubmitting}
            onClick={handleContinue}
            className="bg-[#005bbf] hover:bg-[#004a9e] disabled:opacity-70 text-white px-12 py-4 rounded-full font-semibold text-lg shadow-[0_8px_32px_rgba(24,28,32,0.06)] active:scale-95 transition-all duration-200 min-w-[240px] flex items-center justify-center"
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              "Continue"
            )}
          </button>
          <p className="text-xs text-[#727785] tracking-wide font-medium uppercase">
            Step 2 of 3
          </p>
        </div>
      </div>

      {/* Decorative Background */}
      <div className="fixed bottom-0 left-0 w-full h-64 -z-10 opacity-30 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-[#005bbf]/10 to-transparent" />
      </div>
    </main>
  );
}
