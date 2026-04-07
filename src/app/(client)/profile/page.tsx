"use client";

import { Loader2, Mail, Phone, Shield, User } from "lucide-react";
import { useGoogleAuth } from "@/features/auth/hooks/useGoogleAuth";

export default function ClientProfilePage() {
  const { appUser, isLoading } = useGoogleAuth();

  if (isLoading || !appUser) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-outline)]" />
      </div>
    );
  }

  const initial = (appUser.name?.[0] || appUser.email?.[0] || "U").toUpperCase();

  const fields = [
    { icon: User, label: "Full Name", value: appUser.name || "—", id: "profile-name" },
    { icon: Mail, label: "Email", value: appUser.email || "—", id: "profile-email" },
    { icon: Phone, label: "Phone", value: "—", id: "profile-phone" },
    { icon: Shield, label: "Role", value: "Customer", id: "profile-role" },
  ] as const;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">My Profile</h1>
        <p className="mt-1 text-[var(--color-on-surface-variant)]">Manage your account information</p>
      </div>

      <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-outline-variant)_20%,transparent)] bg-[var(--color-surface-container-lowest)] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.02)]">
        <div className="mb-6 flex items-center gap-4">
          {appUser.avatarUrl ? (
            <img
              src={appUser.avatarUrl}
              alt=""
              className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-xl font-bold text-white">
              {initial}
            </div>
          )}
          <div>
            <p className="font-semibold text-[var(--color-on-surface)]">{appUser.name || "User"}</p>
            <p className="text-sm text-[var(--color-on-surface-variant)]">customer</p>
          </div>
        </div>

        <div className="space-y-0">
          {fields.map((field) => {
            const Icon = field.icon;
            return (
              <div
                key={field.id}
                id={field.id}
                className="flex items-center gap-3 border-b border-[color-mix(in_srgb,var(--color-outline-variant)_12%,transparent)] py-4 last:border-0"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-container-low)]">
                  <Icon className="h-4 w-4 text-[var(--color-on-surface-variant)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[var(--color-on-surface-variant)]">{field.label}</p>
                  <p className="mt-0.5 truncate text-sm font-medium text-[var(--color-on-surface)]">{field.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
