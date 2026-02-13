import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import api from "../utils/api.js";

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/admin/overview");
        setMetrics(response.data.metrics || null);
        setRecentBookings(response.data.recentBookings || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load admin overview");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-8">
          <div className="glass-panel rounded-3xl p-6 shadow-card">
            <h2 className="text-2xl font-display font-bold text-white">🧭 Platform Admin Overview</h2>
            <p className="mt-2 text-sm text-slate-400">Live platform metrics for booking operations.</p>
            {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-xs uppercase text-slate-400">📦 Total</div>
                <div className="mt-2 text-lg font-semibold text-white">{metrics?.totalBookings ?? (loading ? "..." : 0)}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-xs uppercase text-slate-400">✅ Active</div>
                <div className="mt-2 text-lg font-semibold text-white">{metrics?.activeBookings ?? (loading ? "..." : 0)}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-xs uppercase text-slate-400">⏳ Pending</div>
                <div className="mt-2 text-lg font-semibold text-white">{metrics?.pendingBookings ?? (loading ? "..." : 0)}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-xs uppercase text-slate-400">🏁 Completed</div>
                <div className="mt-2 text-lg font-semibold text-white">{metrics?.completedBookings ?? (loading ? "..." : 0)}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-xs uppercase text-slate-400">👷 Providers</div>
                <div className="mt-2 text-lg font-semibold text-white">{metrics?.totalProviders ?? (loading ? "..." : 0)}</div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 shadow-card">
            <h3 className="text-lg font-semibold text-white">📡 Recent Booking Feed</h3>
            <div className="mt-4 space-y-3">
              {recentBookings.length === 0 && !loading ? (
                <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-400">No recent bookings.</div>
              ) : (
                recentBookings.map((item) => (
                  <div key={item.bookingId} className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                    <div>
                      <div className="text-sm text-slate-400">{item.serviceType}</div>
                      <div className="text-sm font-semibold text-white">{item.bookingId}</div>
                      <div className="text-xs text-slate-500">Customer: {item.customerName || "-"}</div>
                    </div>
                    <span className="rounded-full bg-accent-500/20 px-3 py-1 text-xs text-accent-200">{item.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
