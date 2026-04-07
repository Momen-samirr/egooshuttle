import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

/** /auth/login → redirect to canonical /login (inside (auth) route group) */
export default function AuthLoginRedirect() {
  redirect(ROUTES.LOGIN);
}
