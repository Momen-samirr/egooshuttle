"use client";

/**
 * GoogleSignInButton
 *
 * A design-system-aligned button that triggers the Google OAuth flow.
 * Follows the Fluid Authority design system: no hard borders, tonal
 * layering for elevation, ambient shadow, smooth transitions.
 *
 * Props:
 *  - onSuccess: optional callback called after sign-in + user provisioning
 *  - onError:   optional callback called with the typed error code
 *  - label:     overrides the default button label
 *  - compact:   renders a smaller icon-only variant for tight spaces
 */
import { useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useGoogleAuth, type AuthError } from "../hooks/useGoogleAuth";
import { cn } from "@/lib/utils";

/** Inline Google "G" logo SVG — keeps the bundle light (no extra lib needed) */
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/** Human-readable error messages aligned with the Fluid Authority tone */
const ERROR_MESSAGES: Record<AuthError, string> = {
  popup_closed: "Sign-in cancelled. Please try again.",
  account_exists: "This email is already linked to another account.",
  network_error: "Connection failed. Check your internet and try again.",
  unknown: "Something went wrong. Please try again.",
};

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: AuthError) => void;
  label?: string;
  compact?: boolean;
  className?: string;
  id?: string;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  label = "Continue with Google",
  compact = false,
  className,
  id = "google-sign-in-btn",
}: GoogleSignInButtonProps) {
  const { signInWithGoogle, isSigningIn, error, clearError } = useGoogleAuth();

  const handleClick = useCallback(async () => {
    clearError();
    await signInWithGoogle();

    if (error) {
      onError?.(error);
    } else {
      onSuccess?.();
    }
  }, [signInWithGoogle, error, clearError, onSuccess, onError]);

  const busy = isSigningIn;

  return (
    <div className="w-full">
      <button
        id={id}
        type="button"
        disabled={busy}
        onClick={handleClick}
        aria-label={busy ? "Signing in with Google…" : label}
        aria-busy={busy}
        className={cn(
          "w-full flex items-center justify-center gap-3 rounded-xl font-medium",
          "transition-all duration-150 outline-none",
          "focus-visible:ring-4 focus-visible:ring-[rgba(0,91,191,0.2)]",
          compact ? "py-2.5 px-4 text-sm" : "py-3.5 px-5 text-sm",
          busy && "opacity-60 cursor-not-allowed",
          className
        )}
        style={{
          backgroundColor: "var(--color-surface-container-lowest)",
          color: "var(--color-on-surface)",
          boxShadow: "0 8px 32px 0 rgba(24, 28, 32, 0.06)",
        }}
        onMouseEnter={(e) => {
          if (!busy)
            e.currentTarget.style.backgroundColor =
              "var(--color-surface-container)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor =
            "var(--color-surface-container-lowest)";
        }}
      >
        {busy ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
            Connecting to Google…
          </>
        ) : (
          <>
            <GoogleLogo className="w-5 h-5 flex-shrink-0" />
            {!compact && <span>{label}</span>}
          </>
        )}
      </button>

      {/* Inline error message — role="alert" for screen readers */}
      {error && (
        <p
          role="alert"
          className="mt-2 text-xs text-center flex items-center justify-center gap-1.5"
          style={{ color: "var(--color-error)" }}
        >
          {ERROR_MESSAGES[error]}
        </p>
      )}
    </div>
  );
}
