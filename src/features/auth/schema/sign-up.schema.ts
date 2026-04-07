import { z } from "zod";

/**
 * Sign-up form validation schema.
 * Used by SignUpForm via React Hook Form + Zod resolver.
 */
export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "Full name must be at least 3 characters")
      .max(60, "Full name must be at most 60 characters"),

    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),

    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .regex(/^[0-9]{9,11}$/, "Enter a valid phone number (9–11 digits)")
      .transform((val) => {
        // Normalize to E.164 Egyptian format: +20XXXXXXXXXX
        const digits = val.replace(/[\s\-\(\)]/g, "");
        if (digits.startsWith("0")) return `+20${digits.slice(1)}`;
        if (!digits.startsWith("+")) return `+20${digits}`;
        return digits;
      }),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(72, "Password must be at most 72 characters"),

    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;
