"use client";

import { useGoogleAuth } from "@/features/auth/hooks/useGoogleAuth";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { GoogleMap, useJsApiLoader, Autocomplete, Marker } from "@react-google-maps/api";

const LIBRARIES: ("places")[] = ["places"];
const CAIRO_DEFAULT = { lat: 30.0444, lng: 31.2357 }; // Fallback offset for testing natively

export default function LocationSetupPage() {
  const { appUser } = useGoogleAuth();
  const router = useRouter();
  const updateProfile = useMutation(api.users.updateProfile);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  // State
  const [pickup, setPickup] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [dropoff, setDropoff] = useState<{ lat: number; lng: number; address: string } | null>(null);

  // Autocomplete bindings
  const pickupAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const dropoffAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Map Instance
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const onLoadMap = useCallback((map: google.maps.Map) => setMap(map), []);

  useEffect(() => {

    // Auto-fill existing preferences if they refreshed the page
    if (appUser) {
      if (appUser.defaultPickupLat && appUser.defaultPickupLng) {
        setPickup({
          lat: appUser.defaultPickupLat,
          lng: appUser.defaultPickupLng,
          address: appUser.defaultPickupAddress || "",
        });
      }
      if (appUser.defaultDropoffLat && appUser.defaultDropoffLng) {
        setDropoff({
          lat: appUser.defaultDropoffLat,
          lng: appUser.defaultDropoffLng,
          address: appUser.defaultDropoffAddress || "",
        });
      }
    }
  }, [appUser]);

  // If we load coordinates, intelligently bound the map
  useEffect(() => {
    if (map && isLoaded) {
      if (pickup && dropoff) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(pickup);
        bounds.extend(dropoff);
        map.fitBounds(bounds);
      } else if (pickup) {
        map.panTo(pickup);
      } else if (dropoff) {
        map.panTo(dropoff);
      }
    }
  }, [map, pickup, dropoff, isLoaded]);

  if (!appUser) {
    return (
      <main className="flex-grow flex items-center justify-center min-h-screen bg-[#f7f9ff]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </main>
    );
  }

  const handlePlaceChanged = (
    type: "pickup" | "dropoff", 
    ref: React.MutableRefObject<google.maps.places.Autocomplete | null>
  ) => {
    if (ref.current !== null) {
      const place = ref.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || place.name || "";
        
        if (type === "pickup") setPickup({ lat, lng, address });
        else setDropoff({ lat, lng, address });
      }
    }
  };

  const handleDragEnd = async (type: "pickup" | "dropoff", e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    // Reverse geocode
    const geocoder = new window.google.maps.Geocoder();
    try {
      const response = await geocoder.geocode({ location: { lat, lng } });
      const address = response.results[0]?.formatted_address || "Custom Coordinates";
      if (type === "pickup") setPickup({ lat, lng, address });
      else setDropoff({ lat, lng, address });
    } catch (err) {
      // Missing Address permission fallback
      if (type === "pickup") setPickup({ lat, lng, address: `Pinned: ${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      else setDropoff({ lat, lng, address: `Pinned: ${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    }
  };

  const handleSubmit = async (isSkipping: boolean = false) => {
    if (!isSkipping && (!pickup || !dropoff)) {
      alert("Please select both a pickup and drop-off point, or choose Skip for now.");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateProfile({
        isOnboarded: true, // Fire the critical onboarding finishing tag
        ...( !isSkipping && pickup ? {
          defaultPickupAddress: pickup.address,
          defaultPickupLat: pickup.lat,
          defaultPickupLng: pickup.lng,
        } : {}),
        ...( !isSkipping && dropoff ? {
          defaultDropoffAddress: dropoff.address,
          defaultDropoffLat: dropoff.lat,
          defaultDropoffLng: dropoff.lng,
        } : {})
      });

      router.push(ROUTES.DASHBOARD);
    } catch (err) {
      console.error(err);
      alert("Failed to save location preferences");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center p-6 md:p-12 bg-[#f7f9ff] min-h-screen">
      <div className="max-w-6xl w-full bg-[#f1f4fa] rounded-xl overflow-hidden shadow-2xl shadow-blue-900/5 flex flex-col md:flex-row min-h-[700px]">
        
        {/* Left Side: Form Controls */}
        <div className="w-full md:w-5/12 p-8 md:p-12 flex flex-col justify-between bg-white relative z-10">
          <div>
            {/* Progress Indicator */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-1.5 w-12 bg-[#1a73e8] rounded-full"></div>
                <div className="h-1.5 w-12 bg-[#1a73e8] rounded-full"></div>
                <div className="h-1.5 w-12 bg-[#1a73e8] rounded-full"></div>
              </div>
              <span className="text-sm font-medium uppercase tracking-widest text-[#005bbf]">Step 3 of 3</span>
              <h1 className="text-3xl md:text-4xl font-bold mt-2 text-[#181c20] tracking-tight">Set your usual route</h1>
              <p className="text-[#414754] mt-4 text-base">
                Define your most frequent travel path to receive personalized trip recommendations and precision timing.
              </p>
            </div>

            {/* Input Group */}
            <div className="space-y-6 relative">
              {/* Connecting Line Visual */}
              <div className="absolute left-[19px] top-[48px] bottom-[48px] w-0.5 bg-[#c1c6d6] opacity-30"></div>
              
              {/* Pickup Point */}
              <div className="relative group">
                <label className="text-sm font-semibold text-[#414754] mb-2 block ml-10">Pickup Point</label>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#d8e2ff] flex items-center justify-center shrink-0 z-10">
                    <span className="w-3 h-3 bg-[#005bbf] rounded-full" />
                  </div>
                  <div className="flex-grow">
                    {isLoaded ? (
                      <Autocomplete 
                        onLoad={(ac) => (pickupAutocompleteRef.current = ac)}
                        onPlaceChanged={() => handlePlaceChanged("pickup", pickupAutocompleteRef)}
                      >
                         <input 
                            className="w-full bg-[#ebeef4] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#005bbf]/20 text-base placeholder:text-[#727785] transition-all" 
                            placeholder="Enter departure address..." 
                            type="text" 
                            defaultValue={pickup?.address || ""}
                            onChange={(e) => {
                              // Standard controlled input handling without breaking Google Autocomplete bounds
                              setPickup(prev => prev ? {...prev, address: e.target.value} : null);
                            }}
                          />
                      </Autocomplete>
                    ) : (
                      <input className="w-full bg-[#ebeef4] border-none rounded-lg px-4 py-3 text-base" disabled placeholder="Loading maps..." />
                    )}
                  </div>
                </div>
              </div>

              {/* Drop-off Point */}
              <div className="relative group">
                <label className="text-sm font-semibold text-[#414754] mb-2 block ml-10">Drop-Off Point</label>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#86f898] flex items-center justify-center shrink-0 z-10">
                    <span className="w-3 h-3 bg-[#00722f] rounded-full" />
                  </div>
                  <div className="flex-grow">
                     {isLoaded ? (
                      <Autocomplete 
                        onLoad={(ac) => (dropoffAutocompleteRef.current = ac)}
                        onPlaceChanged={() => handlePlaceChanged("dropoff", dropoffAutocompleteRef)}
                      >
                         <input 
                            className="w-full bg-[#ebeef4] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#005bbf]/20 text-base placeholder:text-[#727785] transition-all" 
                            placeholder="Enter destination address..." 
                            type="text" 
                            defaultValue={dropoff?.address || ""}
                            onChange={(e) => {
                              setDropoff(prev => prev ? {...prev, address: e.target.value} : null);
                            }}
                          />
                      </Autocomplete>
                    ) : (
                      <input className="w-full bg-[#ebeef4] border-none rounded-lg px-4 py-3 text-base" disabled placeholder="Loading maps..." />
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Map Selection Helper */}
            <div className="mt-8 p-4 bg-[#ebeef4] rounded-lg flex items-start gap-3">
              <span className="text-[#005bbf] font-bold mt-0.5">i</span>
              <p className="text-xs text-[#414754] leading-relaxed">
                You can also click directly on the map to place markers. Precise coordinates will be saved automatically for your concierge.
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-12 flex flex-col gap-4">
            <button 
              disabled={isSubmitting || (!pickup || !dropoff)}
              onClick={() => handleSubmit(false)}
              className="w-full py-4 px-6 bg-gradient-to-br from-[#005bbf] to-[#1a73e8] text-white disabled:opacity-60 font-semibold rounded-lg shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Setup"}
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>
            <button 
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="text-center text-sm font-medium text-[#727785] hover:text-[#005bbf] transition-colors py-2 uppercase tracking-widest"
            >
              Skip for now
            </button>
          </div>
        </div>

        {/* Right Side: Interactive Map */}
        <div className="w-full md:w-7/12 relative min-h-[400px] md:min-h-full bg-[#dfe3e8]">
          {loadError && (
             <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-red-500 font-bold">Error loading Google Maps API. Please check your constraints.</p>
             </div>
          )}
          {isLoaded && !loadError && (
            <GoogleMap
               mapContainerClassName="w-full h-full"
               center={pickup || dropoff || CAIRO_DEFAULT}
               zoom={11}
               onLoad={onLoadMap}
               options={{

                 disableDefaultUI: false, // Allows zoom and native controls 
                 mapTypeControl: false,
                 streetViewControl: false,
                 styles: [
                    { featureType: "water", elementType: "geometry", stylers: [{ color: "#d7dae0" }] },
                    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f1f4fa" }] },
                 ] // Basic matching of standard map designs
               }}
            >
               {pickup && (
                 <Marker 
                    position={pickup} 
                    draggable={true} 
                    onDragEnd={(e) => handleDragEnd("pickup", e)} 
                    label="P"
                 />
               )}
               {dropoff && (
                 <Marker 
                    position={dropoff} 
                    draggable={true} 
                    onDragEnd={(e) => handleDragEnd("dropoff", e)} 
                    label="D"
                 />
               )}
            </GoogleMap>
          )}
        </div>
        
      </div>
    </main>
  );
}
