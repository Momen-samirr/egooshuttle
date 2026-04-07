"use client";

/**
 * ConvexClientProvider
 *
 * Wraps the app with ConvexAuthProvider (from @convex-dev/auth/react) instead
 * of plain ConvexProvider. This sends auth tokens with every Convex request,
 * enabling ctx.auth.getUserIdentity() to work in backend functions.
 *
 * Per Convex guidelines: use ConvexProviderWithAuth (or the Convex Auth
 * wrapper) whenever authentication is needed — plain ConvexProvider will not
 * forward tokens.
 */
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { useMemo, type ReactNode } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) return null;
    return new ConvexReactClient(url);
  }, []);

  if (!convex) {
    // Renders the app without Convex until NEXT_PUBLIC_CONVEX_URL is set.
    // Run `npx convex dev` to initialize your deployment.
    return <>{children}</>;
  }

  return (
    <ConvexAuthProvider client={convex}>
      {children}
    </ConvexAuthProvider>
  );
}
