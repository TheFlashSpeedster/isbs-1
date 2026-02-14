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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-8">
          <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">🧭 Platform Admin Overview</h2>
            <p className="mt-2 text-sm text-gray-600">Live platform metrics for booking operations.</p>
            {error ? (
              <p className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg bg-purple-50 p-4 border border-purple-200">
                <div className="text-xs uppercase text-gray-600 font-semibold">📦 Total</div>
                <div className="mt-2 text-2xl font-bold text-gray-900">{metrics?.totalBookings ?? (loading ? "Loading..." : 0)}</div>
              </div>
              <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                <div className="text-xs uppercase text-gray-600 font-semibold">✅ Active</div>
                <div className="mt-2 text-2xl font-bold text-gray-900">{metrics?.activeBookings ?? (loading ? "Loading..." : 0)}</div>
              </div>
              <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                <div className="text-xs uppercase text-gray-600 font-semibold">⏳ Pending</div>
                <div className="mt-2 text-2xl font-bold text-gray-900">{metrics?.pendingBookings ?? (loading ? "Loading..." : 0)}</div>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                <div className="text-xs uppercase text-gray-600 font-semibold">🏁 Completed</div>
                <div className="mt-2 text-2xl font-bold text-gray-900">{metrics?.completedBookings ?? (loading ? "Loading..." : 0)}</div>
              </div>
              <div className="rounded-lg bg-gray-100 p-4 border border-gray-300">
                <div className="text-xs uppercase text-gray-600 font-semibold">👷 Providers</div>
                <div className="mt-2 text-2xl font-bold text-gray-900">{metrics?.totalProviders ?? (loading ? "Loading..." : 0)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">📡 Recent Booking Feed</h3>
            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 border border-gray-200">Loading recent bookings...</div>
              ) : recentBookings.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 border border-gray-200">No recent bookings.</div>
              ) : (
                recentBookings.map((item) => (
                  <div key={item.bookingId} className="flex items-center justify-between rounded-lg bg-gray-50 p-4 border border-gray-200">
                    <div>
                      <div className="text-sm text-gray-600">{item.serviceType}</div>
                      <div className="text-sm font-semibold text-gray-900">{item.bookingId}</div>
                      <div className="text-xs text-gray-500">Customer: {item.customerName || "-"}</div>
                    </div>
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700 font-medium">{item.status}</span>
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
