import type { Metadata } from "next";
import { AuthRedirectGuard } from "@/features/auth/components/AuthRedirectGuard";

export const metadata: Metadata = {
  title: {
    default: "Sign In | EgooBus",
    template: "%s | EgooBus",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthRedirectGuard>{children}</AuthRedirectGuard>;
}

