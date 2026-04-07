import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

/** /auth/register → redirect to canonical /sign-up */
export default function AuthRegisterRedirect() {
  redirect(ROUTES.SIGN_UP);
}
