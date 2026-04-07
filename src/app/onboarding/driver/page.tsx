"use client";

import { useGoogleAuth } from "@/features/auth/hooks/useGoogleAuth";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Car } from "lucide-react";
import { ROUTES } from "@/lib/constants";

export default function DriverSetupPage() {
  const { appUser } = useGoogleAuth();
  const router = useRouter();

  const createDriverProfile = useMutation(api.drivers.createDriverProfile);

  const [formData, setFormData] = useState({
    licenseNumber: "",
    vehicleMake: "",
    vehicleModel: "",
    vehiclePlate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!appUser) {
    return (
      <main className="flex-grow flex items-center justify-center min-h-screen bg-[#f7f9ff]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </main>
    );
  }

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      await createDriverProfile(formData);
      
      // Driver is created and marked as isOnboarded = true, but isVerified = false
      router.push(ROUTES.DRIVER_PENDING);
    } catch (err) {
      console.error(err);
      alert("Failed to submit details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-16 px-6 bg-[#f7f9ff] min-h-screen">
      <div className="max-w-2xl w-full">
        {/* Heading Section */}
        <div className="text-center mb-12">
          {/* Progress Indicator */}
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="h-1 w-16 rounded-full bg-[#1a73e8]" />
            <div className="h-1 w-16 rounded-full bg-[#1a73e8]" />
            <div className="h-1 w-16 rounded-full bg-[#1a73e8]" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#181c20] mb-4">
            Driver Details
          </h1>
          <p className="text-[#414754] text-base md:text-lg max-w-md mx-auto">
            Please provide your vehicle and license information to proceed with onboarding.
          </p>
        </div>

        <form onSubmit={handleContinue} className="bg-white rounded-3xl p-8 shadow-[0_8px_32px_rgba(24,28,32,0.06)] border border-[#e0e4f0]">
          <div className="space-y-6">
            
            {/* License Number */}
            <div>
              <label className="text-sm font-semibold tracking-wide text-[#414754] uppercase mb-2 block">
                License Number
              </label>
              <input
                required
                type="text"
                placeholder="e.g. DL-12345678"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#e0e4f0] focus:border-[#005bbf] outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vehicle Make */}
              <div>
                <label className="text-sm font-semibold tracking-wide text-[#414754] uppercase mb-2 block">
                  Vehicle Make
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Toyota"
                  value={formData.vehicleMake}
                  onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#e0e4f0] focus:border-[#005bbf] outline-none transition-colors"
                />
              </div>

              {/* Vehicle Model */}
              <div>
                <label className="text-sm font-semibold tracking-wide text-[#414754] uppercase mb-2 block">
                  Vehicle Model
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Hiace"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#e0e4f0] focus:border-[#005bbf] outline-none transition-colors"
                />
              </div>
            </div>

            {/* Vehicle Plate */}
            <div>
              <label className="text-sm font-semibold tracking-wide text-[#414754] uppercase mb-2 block">
                License Plate
              </label>
              <input
                required
                type="text"
                placeholder="e.g. ABC 123"
                value={formData.vehiclePlate}
                onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#e0e4f0] focus:border-[#005bbf] outline-none transition-colors"
              />
            </div>

          </div>

          {/* CTA Action */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#005bbf] hover:bg-[#004a9e] disabled:opacity-70 text-white px-12 py-4 rounded-full font-semibold text-lg shadow-[0_8px_32px_rgba(24,28,32,0.06)] active:scale-95 transition-all duration-200 min-w-[240px] flex items-center justify-center gap-3 w-full"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Car className="w-5 h-5" />
                  Submit Details
                </>
              )}
            </button>
            <p className="text-xs text-[#727785] tracking-wide font-medium uppercase mt-2">
              Step 3 of 3
            </p>
          </div>
        </form>

      </div>

      {/* Decorative Background */}
      <div className="fixed bottom-0 left-0 w-full h-64 -z-10 opacity-30 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-[#005bbf]/10 to-transparent" />
      </div>
    </main>
  );
}
