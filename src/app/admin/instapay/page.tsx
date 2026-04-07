import { InstaPayVerificationPanel } from "@/features/admin/components/InstaPayVerificationPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "InstaPay Verification | EgooBus Admin",
  description: "Review and verify InstaPay payment proofs",
};

export default function AdminInstaPayPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1
          className="text-3xl font-black tracking-tight"
          style={{ color: "var(--color-on-surface)" }}
        >
          InstaPay Verification
        </h1>
        <p className="text-slate-500 mt-2">
          Review uploaded payment screenshots and approve or reject InstaPay
          transactions.
        </p>
      </header>

      <InstaPayVerificationPanel />
    </div>
  );
}
