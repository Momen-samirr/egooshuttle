"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, QrCode, MapPin, History, Download } from "lucide-react";
import { ROUTES } from "@/lib/constants";

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed" | "canceled">("upcoming");

  const bookingsData = useQuery(api.bookingDays.getUserBookingsWithDays);

  if (bookingsData === undefined) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  const upcomingBookings = bookingsData.filter(b => 
    b.status === "confirmed" && b.days.some(day => day.date >= today && day.status === "active")
  );

  const completedBookings = bookingsData.filter(b => 
    b.status === "confirmed" && !b.days.some(day => day.date >= today && day.status === "active")
  );

  const canceledBookings = bookingsData.filter(b => b.status === "cancelled");

  const currentDisplayBookings = 
    activeTab === "upcoming" ? upcomingBookings :
    activeTab === "completed" ? completedBookings :
    canceledBookings;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Bookings</h1>
        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.DASHBOARD}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
          >
            Book New Trip
          </Link>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-8 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab("upcoming")}
          className={`pb-4 text-sm font-bold transition-colors ${activeTab === "upcoming" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-900"}`}
        >
          Upcoming
        </button>
        <button 
          onClick={() => setActiveTab("completed")}
          className={`pb-4 text-sm font-bold transition-colors ${activeTab === "completed" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-900"}`}
        >
          Completed
        </button>
        <button 
          onClick={() => setActiveTab("canceled")}
          className={`pb-4 text-sm font-bold transition-colors ${activeTab === "canceled" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-900"}`}
        >
          Canceled
        </button>
      </div>

      <div className="flex flex-col gap-10">
        {/* Active Trips Section */}
        {activeTab === "upcoming" && (
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Upcoming Trips</h2>
              <span className="text-sm text-slate-500">{upcomingBookings.length} Active Bookings</span>
            </div>
            
            {upcomingBookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-sm">
                 <p className="text-slate-500 mb-4">You have no upcoming trips.</p>
                 <Link href={ROUTES.DASHBOARD} className="text-blue-600 font-bold hover:underline">Find a ride</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {upcomingBookings.map((booking) => {
                  const sortedDays = [...booking.days].sort((a,b) => a.date.localeCompare(b.date));
                  const firstDay = sortedDays[0]?.date ? new Date(sortedDays[0].date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : '';
                  const lastDay = sortedDays[sortedDays.length-1]?.date ? new Date(sortedDays[sortedDays.length-1].date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : '';                  
                  
                  return (
                    <div key={booking._id} className="bg-white rounded-3xl p-6 flex flex-col gap-6 shadow-sm border border-slate-100 group">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Booking ID: {booking._id.slice(0, 8)}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600 shadow-[0_0_8px_rgba(0,110,44,0.4)]"></span>
                          </div>
                          <h3 className="text-lg font-bold">{booking.tripOrigin} → {booking.tripDestination}</h3>
                        </div>
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase">Confirmed</div>
                      </div>

                      <div className="flex flex-wrap items-center gap-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <CalendarDays className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Date Range</p>
                            <p className="text-sm font-semibold">{firstDay} {sortedDays.length > 1 ? `- ${lastDay}` : ''}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Departure</p>
                            <p className="text-sm font-semibold">{booking.departureTime}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all">
                          <QrCode className="w-5 h-5" />
                          View Boarding Pass
                        </button>
                        <button className="flex-1 bg-slate-100 text-slate-900 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
                          <MapPin className="w-5 h-5" />
                          Track Bus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* History Section (Completed or Canceled) */}
        {activeTab !== "upcoming" && (
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">{activeTab === "completed" ? "Recent History" : "Canceled Trips"}</h2>
            </div>
            
            {currentDisplayBookings.length === 0 ? (
               <div className="bg-white rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-sm">
                 <p className="text-slate-500 mb-4">No {activeTab} trips found.</p>
               </div>
            ) : (
              <div className="space-y-4">
                {currentDisplayBookings.map((booking) => {
                  const sortedDays = [...booking.days].sort((a,b) => a.date.localeCompare(b.date));
                  const firstDay = sortedDays[0]?.date ? new Date(sortedDays[0].date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '';
                  return (
                    <div key={booking._id} className="bg-slate-50 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-6 border border-transparent hover:border-slate-200 transition-all">
                      <div className="w-14 h-14 shrink-0 rounded-xl bg-white flex items-center justify-center text-slate-500 shadow-sm border border-slate-100">
                        <History className="w-6 h-6" />
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center w-full">
                        <div className="flex flex-col">
                          <p className="text-sm font-bold">{booking.tripOrigin} → {booking.tripDestination}</p>
                          <p className="text-xs text-slate-500">Booking ID: {booking._id.slice(0, 8)}</p>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm font-semibold">{firstDay}</p>
                          <p className="text-xs text-slate-500 capitalize">{activeTab} • {booking.departureTime}</p>
                        </div>
                        <div className="flex justify-start md:justify-end gap-3 w-full">
                          <Link href={`/trips/${booking.tripId}`} className="px-4 py-2 rounded-lg text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors">
                            Re-book
                          </Link>
                          {activeTab === "completed" && (
                            <button className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 border border-slate-300 hover:bg-slate-100 transition-colors flex items-center">
                              <Download className="w-4 h-4 mr-2" /> Receipt
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
