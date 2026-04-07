"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

/**
 * Maps raw Convex server error messages to user-friendly strings.
 * Keeps error-handling logic out of the UI render tree.
 */
function mapServerError(err: unknown): string {
  const msg = err instanceof Error ? err.message : "";
  if (msg.includes("Email already in use")) {
    return "An account with this email already exists. Please sign in instead.";
  }
  if (msg.includes("Phone number already in use")) {
    return "This phone number is already registered. Please use a different number.";
  }
  return "Something went wrong. Please try again.";
}

import { signUpSchema, type SignUpFormValues } from "../schema/sign-up.schema";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { GoogleSignInButton } from "./GoogleSignInButton";



// ---------------------------------------------------------------------------
// Internal sub-components
// ---------------------------------------------------------------------------

/** Label conforming to DESIGN.md §3 label-sm: all-caps, 500 weight, 11px */
function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-label-sm block mb-1.5"
      style={{ color: "var(--color-on-surface-variant)" }}
    >
      {children}
    </label>
  );
}

/** Error message with icon */
function FieldError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-center gap-1.5 mt-1.5 text-xs"
      style={{ color: "var(--color-error)" }}
    >
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {message}
    </p>
  );
}

/** Input conforming to DESIGN.md §5: surface-container-highest bg, no border,
 *  focus = 2px primary ghost border at 20% opacity (soft outer glow) */
interface FluidInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

function FluidInput({
  hasError,
  leftIcon,
  rightElement,
  className,
  style,
  ...props
}: FluidInputProps) {
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
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
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
          ...style,
        }}
        className={cn(
          "w-full py-3.5 rounded-xl text-sm",
          leftIcon ? "pl-11 pr-4" : "px-4",
          rightElement && "pr-11",
          className
        )}
        {...props}
      />
      {rightElement && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2">
          {rightElement}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main SignUpForm component
// ---------------------------------------------------------------------------
export function SignUpForm() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const getOrCreateAppUser = useMutation(api.users.getOrCreateAppUser);
  const updateProfile = useMutation(api.users.updateProfile);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: SignUpFormValues) => {
    setServerError(null);
    try {
      // 1. Register with Convex Auth Password provider
      //    `data.email` is already lowercased by the Zod schema transform.
      await signIn("password", {
        flow: "signUp",
        email: data.email.trim().toLowerCase(),
        password: data.password,
        name: data.fullName,
      });

      // 2. Provision the app-level user profile (email uniqueness enforced here)
      await getOrCreateAppUser();

      // 3. Persist the phone number immediately so the uniqueness constraint
      //    fires at registration time, not deferred to the onboarding step.
      //    `data.phoneNumber` is already normalised to +20XXXXXXXXXX by Zod.
      await updateProfile({ phone: data.phoneNumber });

      setIsSuccess(true);
      // GlobalOnboardingGuard will redirect to /onboarding/profile
      // since isOnboarded is false for new users
      setTimeout(() => router.push(ROUTES.DASHBOARD), 1000);
    } catch (err) {
      setServerError(mapServerError(err));
    }
  };

  // ---- Success State ----
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--color-secondary-container)" }}
        >
          <CheckCircle
            className="w-8 h-8"
            style={{ color: "var(--color-secondary)" }}
          />
        </div>
        <h3
          className="text-title-md"
          style={{ color: "var(--color-on-surface)" }}
        >
          Account created!
        </h3>
        <p
          className="text-body-md"
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          Redirecting you to set up your profile…
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      id="sign-up-form"
      className="space-y-5"
    >
      {/* Server error banner */}
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

      {/* Full Name */}
      <div>
        <FieldLabel htmlFor="signup-name">Full Name</FieldLabel>
        <FluidInput
          id="signup-name"
          type="text"
          placeholder="John Doe"
          autoComplete="name"
          hasError={!!errors.fullName}
          leftIcon={<User className="w-4 h-4" />}
          {...register("fullName")}
        />
        {errors.fullName && <FieldError message={errors.fullName.message!} />}
      </div>

      {/* Email */}
      <div>
        <FieldLabel htmlFor="signup-email">Email Address</FieldLabel>
        <FluidInput
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          hasError={!!errors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          {...register("email")}
        />
        {errors.email && <FieldError message={errors.email.message!} />}
      </div>

      {/* Phone Number — Egyptian +20 prefix */}
      <div>
        <FieldLabel htmlFor="signup-phone">Phone Number</FieldLabel>
        <div className="flex">
          {/* Prefix chip — surface-container-high per spec interactive tones */}
          <div
            className="flex items-center gap-2 px-4 py-3.5 rounded-l-xl text-sm font-medium flex-shrink-0"
            style={{
              backgroundColor: "var(--color-surface-container-high)",
              color: "var(--color-on-surface-variant)",
              borderRight: "1px solid rgba(193,198,214,0.15)", /* ghost border */
            }}
          >
            <Phone className="w-4 h-4" style={{ color: "var(--color-outline)" }} />
            +20
          </div>
          <input
            id="signup-phone"
            type="tel"
            placeholder="10XXXXXXXX"
            autoComplete="tel"
            {...register("phoneNumber")}
            className="flex-1 px-4 py-3.5 rounded-r-xl text-sm outline-none transition-all duration-150"
            style={{
              backgroundColor: errors.phoneNumber
                ? "var(--color-error-container)"
                : "var(--color-surface-container-highest)",
              color: "var(--color-on-surface)",
              border: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--color-surface-container-lowest)";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(0,91,191,0.2)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.backgroundColor =
                errors.phoneNumber
                  ? "var(--color-error-container)"
                  : "var(--color-surface-container-highest)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
        {errors.phoneNumber && (
          <FieldError message={errors.phoneNumber.message!} />
        )}
      </div>

      {/* Password + Confirm — side by side on md+ (per design reference) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="signup-password">Password</FieldLabel>
          <FluidInput
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            hasError={!!errors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            rightElement={
              <button
                type="button"
                id="toggle-signup-password"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{ color: "var(--color-outline)" }}
                className="hover:opacity-80 transition-opacity"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
            {...register("password")}
          />
          {errors.password && (
            <FieldError message={errors.password.message!} />
          )}
        </div>
        <div>
          <FieldLabel htmlFor="signup-confirm">Confirm Password</FieldLabel>
          <FluidInput
            id="signup-confirm"
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            hasError={!!errors.confirmPassword}
            leftIcon={<Lock className="w-4 h-4" />}
            rightElement={
              <button
                type="button"
                id="toggle-signup-confirm"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={
                  showConfirm ? "Hide confirmation" : "Show confirmation"
                }
                style={{ color: "var(--color-outline)" }}
                className="hover:opacity-80 transition-opacity"
              >
                {showConfirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <FieldError message={errors.confirmPassword.message!} />
          )}
        </div>
      </div>

      {/* Submit — Hero CTA gradient per DESIGN.md §2 Glass & Gradient Rule */}
      <button
        type="submit"
        id="signup-submit"
        disabled={isSubmitting}
        className={cn(
          "relative w-full py-4 rounded-xl font-bold text-white text-sm mt-2",
          "transition-all duration-200 outline-none",
          "focus-visible:ring-4 focus-visible:ring-[rgba(0,91,191,0.3)]",
          "active:scale-[0.98]",
          !isSubmitting &&
            "hover:scale-[1.01] hover:shadow-[0_8px_24px_rgba(0,91,191,0.3)]"
        )}
        style={{
          background: isSubmitting
            ? "rgba(0,91,191,0.5)"
            : "linear-gradient(135deg, #005bbf 0%, #1a73e8 100%)",
          boxShadow: isSubmitting
            ? "none"
            : "0 8px 32px 0 rgba(0,91,191,0.25)",
          cursor: isSubmitting ? "not-allowed" : "pointer",
        }}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Creating your account…
          </span>
        ) : (
          "Create Account"
        )}
      </button>

      {/* Divider */}
      <div className="relative flex items-center gap-3 py-1">
        <div
          className="flex-1 h-px"
          style={{
            backgroundColor:
              "rgba(193, 198, 214, 0.3)" /* outline-variant @ 30% */,
          }}
        />
        <span className="text-label-sm" style={{ color: "var(--color-outline)" }}>
          or
        </span>
        <div
          className="flex-1 h-px"
          style={{ backgroundColor: "rgba(193, 198, 214, 0.3)" }}
        />
      </div>

      {/* Google Sign Up — real Convex Auth OAuth flow */}
      {/* onSuccess goes to /dashboard; GlobalOnboardingGuard handles routing */}
      <GoogleSignInButton
        id="signup-google"
        label="Sign up with Google"
        onSuccess={() => router.push(ROUTES.DASHBOARD)}
      />
    </form>
  );
}
