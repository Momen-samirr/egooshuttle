"use client";

import { useGoogleAuth } from "@/features/auth/hooks/useGoogleAuth";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Camera, User, Plus } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Make phone strictly match an Egyptian 11-digit or generic numeric format
const profileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-\(\)]+$/, "Invalid phone format")
    .min(8, "Phone is too short")
    .max(20)
    .transform((val) => {
      // Normalise to E.164 Egyptian format to match server-side normalisation
      const stripped = val.replace(/[\s\-\(\)]/g, "");
      if (stripped.startsWith("0")) return `+20${stripped.slice(1)}`;
      if (!stripped.startsWith("+")) return `+20${stripped}`;
      return stripped;
    }),
});
type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileSetupPage() {
  const { appUser } = useGoogleAuth();
  const router = useRouter();
  
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Derived state: Use the locally selected file if it exists, otherwise fall back to db
  const previewUrl = selectedFile ? URL.createObjectURL(selectedFile) : (appUser?.avatarUrl || null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    // `values` acts reactively: it automatically populates and resets form bindings the microsecond `appUser` streams in
    values: {
      name: appUser?.name || "",
      phone: appUser?.phone || "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Max 10MB allowed.");
      return;
    }

    setSelectedFile(file);
  };


  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true);
      setPhoneError(null);
      setSubmitError(null);
      
      let storageId: string | undefined = undefined;

      // 1. Upload photo to Convex Storage if one was selected
      if (selectedFile) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });
        
        if (!result.ok) throw new Error("File upload failed");
        const json = await result.json();
        storageId = json.storageId;
      }

      // 2. Persist data (do not mark as onboarded yet)
      await updateProfile({
        name: data.name,
        phone: data.phone, // already normalised by Zod transform
        storageId: storageId as any,
      });

      router.push("/onboarding/role");

    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Phone number already in use")) {
        setPhoneError("This phone number is already registered. Please use a different number.");
      } else {
        console.error(err);
        setSubmitError("Something went wrong saving your profile. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!appUser) {
    return (
      <main className="flex-grow flex items-center justify-center min-h-screen bg-[#f7f9ff]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </main>
    );
  }

  return (
    <main className="flex-grow flex items-center justify-center px-6 py-12 min-h-screen bg-[#f7f9ff]">

      <div className="max-w-2xl w-full">
        {/* Progress Indicator */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="h-1 w-16 rounded-full bg-[#1a73e8]" />
            <div className="h-1 w-16 rounded-full bg-[#dfe3e8]" />
            <div className="h-1 w-16 rounded-full bg-[#dfe3e8]" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-[#181c20] mb-2">
            Profile Setup
          </h1>
          <p className="text-[#414754] font-medium">Step 1 of 3</p>


        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl p-8 md:p-12 shadow-[0_8px_32px_rgba(24,28,32,0.06)]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-6">
              <input
                type="file"
                accept="image/png, image/jpeg"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <div 
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-32 h-32 rounded-full bg-[#f1f4fa] flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:bg-[#e5e8ee] border-4 border-white">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-[#c1c6d6]" />
                  )}
                  
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white w-8 h-8" />
                  </div>
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 bg-[#1a73e8] text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-wider text-[#005bbf]">
                  Upload Profile Photo
                </p>
                <p className="text-base text-[#414754] mt-1">PNG or JPG up to 10MB</p>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-6">
              {/* Name */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-[#414754] px-1">
                  Full Name
                </label>
                <input
                  type="text"
                  {...register("name")}
                  className={cn(
                    "w-full bg-[#dfe3e8] border-none rounded-lg px-4 py-4 text-base transition-all duration-200",
                    "focus:ring-2 focus:ring-[#005bbf]/20 focus:bg-white outline-none",
                    errors.name && "ring-2 ring-red-500/50 focus:ring-red-500/50"
                  )}
                  placeholder="Your Name"
                />
                {errors.name && <p className="text-sm text-red-500 px-1">{errors.name.message}</p>}
              </div>

              {/* Email (Read Only from Google OAuth) */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-[#414754] px-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={appUser?.email || ""}
                  disabled
                  readOnly
                  className="w-full bg-[#ebeef4] text-[#727785] border-none rounded-lg px-4 py-4 text-base cursor-not-allowed"
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-[#414754] px-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  {...register("phone")}
                  placeholder="+20 100 000 0000"
                  className={cn(
                    "w-full bg-[#dfe3e8] border-none rounded-lg px-4 py-4 text-base transition-all duration-200",
                    "focus:ring-2 focus:ring-[#005bbf]/20 focus:bg-white outline-none",
                    (errors.phone || phoneError) && "ring-2 ring-red-500/50 focus:ring-red-500/50"
                  )}
                />
                {errors.phone && <p className="text-sm text-red-500 px-1">{errors.phone.message}</p>}
                {phoneError && !errors.phone && (
                  <p className="text-sm text-red-500 px-1">{phoneError}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col items-center gap-6">
              {submitError && (
                <p className="w-full text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-center">
                  {submitError}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center w-full bg-[#1a73e8] text-white font-bold py-4 rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all duration-200 text-lg disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Continue"}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  router.push("/onboarding/role");
                }}
                className="text-sm font-bold uppercase tracking-widest text-[#005bbf] hover:text-[#1a73e8] transition-colors"

              >
                Skip for now
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center opacity-40">
          <p className="text-sm font-bold uppercase tracking-widest">The Fluid Authority</p>
        </div>
      </div>
    </main>
  );
}
