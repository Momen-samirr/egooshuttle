"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { GoogleSignInButton } from "./GoogleSignInButton";



// ---------------------------------------------------------------------------
// Internal: FluidInput — matches DESIGN.md §5 input spec
// ---------------------------------------------------------------------------
interface FluidInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

function FluidInput({ hasError, leftIcon, rightElement, ...props }: FluidInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      {leftIcon && (
        <span
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--color-outline)" }}
        >
          {leftIcon}
        </span>
      )}
      <input
        onFocus={() => setFocused(true)}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={{
          backgroundColor: hasError
            ? "var(--color-error-container)"
            : focused
            ? "var(--color-surface-container-lowest)"
            : "var(--color-surface-container-highest)",
          border: "none",
          outline: "none",
          boxShadow: hasError
            ? "0 0 0 3px rgba(186, 26, 26, 0.2)"
            : focused
            ? "0 0 0 3px rgba(0, 91, 191, 0.2)"
            : "none",
          transition: "background-color 150ms ease, box-shadow 150ms ease",
          color: "var(--color-on-surface)",
        }}
        className={cn(
          "w-full py-3.5 rounded-xl text-sm",
          leftIcon ? "pl-11 pr-4" : "px-4",
          rightElement && "pr-11"
        )}
        {...props}
      />
      {rightElement && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2">{rightElement}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LoginForm
// ---------------------------------------------------------------------------
export function LoginForm() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const getOrCreateAppUser = useMutation(api.users.getOrCreateAppUser);

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await signIn("password", {
        flow: "signIn",
        email: data.email,
        password: data.password,
      });
      // Provision appUser in case it was created via a different provider before
      await getOrCreateAppUser();
      // GlobalOnboardingGuard handles routing to onboarding or role dashboard
      router.push(ROUTES.DASHBOARD);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      id="login-form"
      className="space-y-5"
    >
      {/* Server error */}
      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
          style={{
            backgroundColor: "var(--color-error-container)",
            color: "var(--color-on-error-container)",
          }}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Email */}
      <div>
        <label
          htmlFor="login-email"
          className="text-label-sm block mb-1.5"
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          Email Address
        </label>
        <FluidInput
          id="login-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          hasError={!!errors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          {...register("email")}
        />
        {errors.email && (
          <p role="alert" className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: "var(--color-error)" }}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="login-password"
            className="text-label-sm"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            Password
          </label>
          <a
            href="#"
            id="login-forgot-password"
            className="text-xs font-medium hover:underline"
            style={{ color: "var(--color-primary)" }}
          >
            Forgot password?
          </a>
        </div>
        <FluidInput
          id="login-password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="current-password"
          hasError={!!errors.password}
          leftIcon={<Lock className="w-4 h-4" />}
          rightElement={
            <button
              type="button"
              id="toggle-login-password"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{ color: "var(--color-outline)" }}
              className="hover:opacity-80 transition-opacity"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          {...register("password")}
        />
        {errors.password && (
          <p role="alert" className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: "var(--color-error)" }}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit — Hero CTA gradient */}
      <button
        type="submit"
        id="login-submit"
        disabled={isSubmitting}
        className={cn(
          "relative w-full py-4 rounded-xl font-bold text-white text-sm mt-2",
          "transition-all duration-200 outline-none active:scale-[0.98]",
          "focus-visible:ring-4 focus-visible:ring-[rgba(0,91,191,0.3)]",
          !isSubmitting && "hover:scale-[1.01] hover:shadow-[0_8px_24px_rgba(0,91,191,0.3)]"
        )}
        style={{
          background: isSubmitting
            ? "rgba(0,91,191,0.5)"
            : "linear-gradient(135deg, #005bbf 0%, #1a73e8 100%)",
          boxShadow: isSubmitting ? "none" : "0 8px 32px 0 rgba(0,91,191,0.25)",
          cursor: isSubmitting ? "not-allowed" : "pointer",
        }}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Signing in…
          </span>
        ) : (
          "Sign In"
        )}
      </button>

      {/* Divider */}
      <div className="relative flex items-center gap-3 py-1">
        <div className="flex-1 h-px" style={{ backgroundColor: "rgba(193,198,214,0.3)" }} />
        <span className="text-label-sm" style={{ color: "var(--color-outline)" }}>or</span>
        <div className="flex-1 h-px" style={{ backgroundColor: "rgba(193,198,214,0.3)" }} />
      </div>

      {/* Google Sign In — real Convex Auth OAuth flow */}
      <GoogleSignInButton
        id="login-google"
        label="Continue with Google"
        onSuccess={() => router.push(ROUTES.DASHBOARD)}
      />
    </form>
  );
}
