import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

/**
 * /register is deprecated — permanently redirect to the canonical /sign-up page.
 * This file can be deleted once the app shell confirms no hard-coded /register links remain.
 */
export default function RegisterRedirectPage() {
  redirect(ROUTES.SIGN_UP);
}
