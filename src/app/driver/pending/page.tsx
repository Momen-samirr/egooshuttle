"use client";

import { useGoogleAuth } from "@/features/auth/hooks/useGoogleAuth";
import { Loader2, ShieldAlert, LogOut, FileBadge } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";

export default function DriverPendingPage() {
  const { appUser } = useGoogleAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();

  if (!appUser) {
    return (
      <main className="flex-grow flex items-center justify-center min-h-screen bg-[#f7f9ff]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </main>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-16 px-6 bg-[#f7f9ff] min-h-screen">
      <div className="max-w-xl w-full">
        {/* Status Card */}
        <div className="bg-white rounded-[2rem] p-10 md:p-14 shadow-[0_8px_32px_rgba(24,28,32,0.06)] border border-[#e0e4f0] text-center relative overflow-hidden">
          
          {/* Background Illustration Element */}
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <FileBadge className="w-64 h-64 text-[#ff9800] -mr-16 -mt-16" />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Animated Warning Icon */}
            <div className="w-24 h-24 bg-[#fff4e5] rounded-full flex items-center justify-center mb-8 border-4 border-white shadow-xl shadow-[#ff9800]/10 flex-shrink-0 animate-pulse">
              <ShieldAlert className="w-12 h-12 text-[#ff9800]" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#181c20] mb-4">
              Pending Activation
            </h1>
            
            <p className="text-[#414754] text-lg leading-relaxed mb-6">
              Hi <strong>{appUser.name}</strong>, your driver application has been successfully submitted and is currently under review by our administration team.
            </p>

            <div className="bg-[#f8f9fc] p-6 rounded-2xl border border-[#e0e4f0] w-full mb-10 text-left">
              <h3 className="font-semibold text-[#181c20] mb-2">What happens next?</h3>
              <ul className="text-[#414754] space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#005bbf] rounded-full mt-1.5 flex-shrink-0" />
                  <span>We will verify your vehicle and license details.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#005bbf] rounded-full mt-1.5 flex-shrink-0" />
                  <span>Once approved, this page will automatically unlock.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#005bbf] rounded-full mt-1.5 flex-shrink-0" />
                  <span>You will gain full access to view, bid, and manage trips.</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleSignOut}
              className="group flex items-center gap-2 text-[#727785] hover:text-[#181c20] font-medium transition-colors"
            >
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Sign out for now
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
