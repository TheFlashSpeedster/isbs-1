import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import CountdownTimer from "../components/CountdownTimer.jsx";
import api from "../utils/api.js";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { state: { from: "/dashboard" } });
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await api.get("/history");
        setBookings(response.data.bookings || []);
      } catch (err) {
        setError("Unable to load booking history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [navigate]);

  const activeBooking = bookings.find((booking) => booking.status === "ACTIVE" || booking.status === "PENDING");
  const handleCancel = async (bookingId) => {
    try {
      await api.post(`/booking/${bookingId}/cancel`);
      setBookings((prev) =>
        prev.map((booking) =>
          booking.bookingId === bookingId ? { ...booking, status: "CANCELLED" } : booking
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to cancel booking");
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1 space-y-6">
            <div className="glass-panel rounded-3xl p-6 shadow-card">
              <h2 className="text-2xl font-display font-bold text-white">📋 Active Booking</h2>
              {loading ? (
                <p className="mt-4 text-sm text-slate-400">Loading...</p>
              ) : activeBooking ? (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                    <div>
                      <div className="text-sm text-slate-400">🆔 Booking ID</div>
                      <div className="text-base font-semibold text-white">{activeBooking.bookingId}</div>
                    </div>
                    <div className="text-sm text-slate-300">{activeBooking.serviceType}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {activeBooking.etaAt ? <CountdownTimer target={activeBooking.etaAt} /> : null}
                    <span className="text-sm text-slate-300">Status: {activeBooking.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to={`/booking/${activeBooking.bookingId}`}
                      className="inline-flex rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-soft"
                    >
                      Track Provider
                    </Link>
                    <button
                      onClick={() => handleCancel(activeBooking.bookingId)}
                      className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-400">No active bookings. Ready to book a service?</p>
              )}
            </div>

            <div className="glass-panel rounded-3xl p-6 shadow-card">
              <h3 className="text-lg font-semibold text-white">📚 Booking History</h3>
              {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}
              <div className="mt-4 space-y-3">
                {bookings.length === 0 && !loading ? (
                  <p className="text-sm text-slate-400">No bookings yet.</p>
                ) : (
                  bookings.map((booking) => (
                    <div key={booking.bookingId} className="rounded-2xl bg-white/5 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-slate-400">{booking.serviceType}</div>
                          <div className="text-sm font-semibold text-white">{booking.bookingId}</div>
                        </div>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                          {booking.status}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        Provider: {booking.providerName || "Assigned"} | {new Date(booking.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-6">
            <div className="glass-panel rounded-3xl p-6 shadow-card">
              <h3 className="text-lg font-semibold text-white">👤 Profile</h3>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <div>Name: {user?.name || "Guest"}</div>
                <div>Email: {user?.email || "-"}</div>
                <div>Phone: {user?.phone || "-"}</div>
                <div>Role: {user?.role || "CUSTOMER"}</div>
              </div>
            </div>
            <div className="glass-panel rounded-3xl p-6 shadow-card">
              <h3 className="text-lg font-semibold text-white">📍 Saved Addresses</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-2xl bg-white/5 p-3">
                  Home - 221B Baker Street, Central City
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  Office - 19 Service Lane, Downtown
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-3xl p-6 shadow-card">
              <h3 className="text-lg font-semibold text-white">⚡ Quick Actions</h3>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  to="/"
                  className="rounded-full border border-white/10 px-4 py-2 text-center text-sm text-white hover:bg-white/10"
                >
                  Book another service
                </Link>
                <Link
                  to="/book/cooking"
                  className="rounded-full bg-emergency px-4 py-2 text-center text-sm font-semibold text-white"
                >
                  Emergency booking
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
