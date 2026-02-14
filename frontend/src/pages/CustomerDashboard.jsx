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

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "COMPLETED":
        return "bg-blue-100 text-blue-700";
      case "CANCELLED":
        return "bg-gray-200 text-gray-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-purple-100 text-purple-700";
    }
  };

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

  const safeBookings = bookings.filter((booking) =>
    booking && booking.bookingId && booking.serviceType && booking.status
  );
  const activeBooking = safeBookings.find((booking) =>
    booking.status === "ACTIVE" || booking.status === "PENDING"
  );
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12">
        {error ? (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1 space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">📋 Active Booking</h2>
              {loading ? (
                <p className="mt-4 text-sm text-gray-600">Loading...</p>
              ) : activeBooking ? (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-purple-50 p-4 border border-purple-200">
                    <div>
                      <div className="text-sm text-gray-600">🆔 Booking ID</div>
                      <div className="text-base font-semibold text-gray-900">{activeBooking.bookingId}</div>
                    </div>
                    <div className="text-sm text-gray-700">{activeBooking.serviceType}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {activeBooking.etaAt ? <CountdownTimer target={activeBooking.etaAt} /> : null}
                    <span className="text-sm text-gray-700">Status: {activeBooking.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to={`/booking/${activeBooking.bookingId}`}
                      className="inline-flex rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-purple-700"
                    >
                      Track Provider
                    </Link>
                    <button
                      onClick={() => handleCancel(activeBooking.bookingId)}
                      className="inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-600">No active bookings. Ready to book a service?</p>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">📚 Booking History</h3>
              <div className="mt-4 space-y-3">
                {loading ? (
                  <p className="text-sm text-gray-600">Loading booking history...</p>
                ) : safeBookings.length === 0 ? (
                  <p className="text-sm text-gray-600">No bookings yet.</p>
                ) : (
                  safeBookings.map((booking) => (
                    <Link
                      key={booking.bookingId}
                      to={`/booking/${booking.bookingId}`}
                      className="block rounded-lg bg-gray-50 p-4 border border-gray-200 hover:border-purple-300 hover:shadow-sm transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-600">{booking.serviceType}</div>
                          <div className="text-sm font-semibold text-gray-900">{booking.bookingId}</div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Provider: {booking.providerName || "Assigned"} | {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "-"}
                      </div>
                      <div className="mt-2 text-xs text-purple-600 font-medium">
                        View details & tracking
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">👤 Profile</h3>
              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <div>Name: {user?.name || "Guest"}</div>
                <div>Email: {user?.email || "-"}</div>
                <div>Phone: {user?.phone || "-"}</div>
                <div>Role: {user?.role || "CUSTOMER"}</div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">📍 Saved Addresses</h3>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <div className="rounded-lg bg-gray-50 p-3 border border-gray-200">
                  Home - 221B Baker Street, Central City
                </div>
                <div className="rounded-lg bg-gray-50 p-3 border border-gray-200">
                  Office - 19 Service Lane, Downtown
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">⚡ Quick Actions</h3>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  to="/"
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Book another service
                </Link>
                <Link
                  to="/book/cooking"
                  className="rounded-lg bg-purple-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-md hover:bg-purple-700"
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
