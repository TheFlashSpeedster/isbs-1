import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import api from "../utils/api.js";
import { findServiceById } from "../utils/services.js";

export default function BookingPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const emergencyParam = searchParams.get("emergency") === "1";
  const service = useMemo(() => findServiceById(serviceId), [serviceId]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const [form, setForm] = useState({
    latitude: "28.6139",
    longitude: "77.209",
    isEmergency: emergencyParam,
    paymentMethod: "Cash"
  });

  if (!service) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center text-white">
          Service not found.
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!token) {
      navigate("/login", { state: { from: `/book/${serviceId}${location.search}` } });
    }
  }, [navigate, serviceId, token, location.search]);

  if (!token) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/book", {
        serviceType: service.name,
        userLocation: {
          latitude: Number(form.latitude),
          longitude: Number(form.longitude)
        },
        isEmergency: form.isEmergency,
        paymentMethod: form.paymentMethod
      });
      const bookingId = response.data.booking.bookingId;
      navigate(`/booking/${bookingId}`, { state: response.data });
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const displayPrice = form.isEmergency ? Math.round(service.price * 1.5) : service.price;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="glass-panel rounded-3xl p-8 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">{service.name} Booking</h2>
                  <p className="mt-2 text-sm text-slate-400">We will dispatch the closest pro instantly.</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/20 text-lg text-primary-200">
                  {service.icon}
                </span>
              </div>
              {error ? (
                <div className="mt-4 rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-200">{error}</div>
              ) : null}
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="number"
                    step="0.0001"
                    name="latitude"
                    value={form.latitude}
                    onChange={handleChange}
                    placeholder="Latitude"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    name="longitude"
                    value={form.longitude}
                    onChange={handleChange}
                    placeholder="Longitude"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  Emergency booking (5-min priority + surge)
                  <input
                    type="checkbox"
                    name="isEmergency"
                    checked={form.isEmergency}
                    onChange={handleChange}
                    className="h-4 w-4 accent-emergency"
                  />
                </label>
                <div>
                  <label className="text-xs uppercase text-slate-400">Payment Method</label>
                  <div className="mt-2 grid gap-3 md:grid-cols-3">
                    {[
                      "Cash",
                      "UPI",
                      "Card"
                    ].map((method) => (
                      <label key={method} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                        {method}
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={form.paymentMethod === method}
                          onChange={handleChange}
                          className="accent-primary-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-primary-500 py-3 text-sm font-semibold text-white shadow-soft hover:bg-primary-400"
                >
                  {loading ? "Booking..." : "Confirm Booking"}
                </button>
              </form>
            </div>
          </div>
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 shadow-card">
              <h3 className="text-lg font-semibold text-white">Price Summary</h3>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                <span>Base price</span>
                <span>Rs {service.price}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-slate-300">
                <span>Emergency surge</span>
                <span>{form.isEmergency ? "1.5x" : "-"}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-base font-semibold text-white">
                <span>Total</span>
                <span>Rs {displayPrice}</span>
              </div>
            </div>
            <div className="glass-panel rounded-3xl p-6 shadow-card">
              <h3 className="text-lg font-semibold text-white">Instant Assignment</h3>
              <p className="mt-3 text-sm text-slate-400">
                We auto-match you with the nearest verified provider, update ETA in real time, and keep you informed.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent-500/30" />
                <div>
                  <div className="text-sm font-semibold text-white">Smart dispatch engine</div>
                  <div className="text-xs text-slate-400">Nearest provider in 30 seconds</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
