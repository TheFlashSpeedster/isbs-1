import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import ProvidersMap from "../components/ProvidersMap.jsx";
import NearbyProviders from "../components/NearbyProviders.jsx";
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
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role || "CUSTOMER";
  const [showMap, setShowMap] = useState(false);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [form, setForm] = useState({
    latitude: "31.2520",
    longitude: "75.7050",
    isEmergency: emergencyParam,
    paymentMethod: "Cash"
  });

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center text-gray-900">
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

  if (role !== "CUSTOMER") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Booking is for customers only</h2>
          <p className="mt-3 text-sm text-gray-600">
            Providers and admins cannot create service bookings. Please use your dashboard tools.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleLocationSelect = useCallback((location) => {
    setForm((prev) => ({
      ...prev,
      latitude: location.lat.toString(),
      longitude: location.lng.toString()
    }));
  }, []);

  const handleProvidersLoad = useCallback((loadedProviders) => {
    setProviders(loadedProviders);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const bookingData = {
        serviceType: service.name,
        userLocation: {
          latitude: Number(form.latitude),
          longitude: Number(form.longitude)
        },
        isEmergency: form.isEmergency,
        paymentMethod: form.paymentMethod
      };
      
      // If user selected a specific provider, include it in the booking
      if (selectedProvider) {
        bookingData.preferredProviderId = selectedProvider.id;
      }
      
      const response = await api.post("/book", bookingData);
      const bookingId = response.data.booking.bookingId;
      navigate(`/booking/${bookingId}`, { state: response.data });
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const displayPrice = form.isEmergency ? Math.round(service.price * 1.5) : service.price;

  // Memoize userLocation to prevent unnecessary re-renders
  const userLocation = useMemo(() => ({
    latitude: form.latitude,
    longitude: form.longitude
  }), [form.latitude, form.longitude]);

  // Memoize map location for ProvidersMap
  const mapLocation = useMemo(() => ({
    lat: parseFloat(form.latitude),
    lng: parseFloat(form.longitude)
  }), [form.latitude, form.longitude]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="rounded-2xl bg-white p-8 shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{service.name} Booking</h2>
                  <p className="mt-2 text-sm text-gray-600">We will dispatch the closest pro instantly.</p>
                </div>
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-3xl">
                  {service.icon}
                </span>
              </div>
              {error ? (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
              ) : null}
              <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                {/* Location Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-900">📍 Service Location</label>
                    <button
                      type="button"
                      onClick={() => setShowMap(!showMap)}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      {showMap ? "Hide Map" : "Show Map"}
                    </button>
                  </div>

                  {showMap ? (
                    <ProvidersMap
                      userLocation={mapLocation}
                      providers={providers}
                      onLocationSelect={handleLocationSelect}
                      selectedProvider={selectedProvider}
                      onProviderSelect={setSelectedProvider}
                    />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase">Latitude</label>
                        <input
                          type="number"
                          step="0.000001"
                          name="latitude"
                          value={form.latitude}
                          onChange={handleChange}
                          placeholder="31.2520"
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase">Longitude</label>
                        <input
                          type="number"
                          step="0.000001"
                          name="longitude"
                          value={form.longitude}
                          onChange={handleChange}
                          placeholder="75.7050"
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <label className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 cursor-pointer hover:bg-gray-50">
                  Emergency booking (5-min priority + surge)
                  <input
                    type="checkbox"
                    name="isEmergency"
                    checked={form.isEmergency}
                    onChange={handleChange}
                    className="h-4 w-4 accent-purple-600"
                  />
                </label>
                <div>
                  <label className="text-xs uppercase text-gray-600 font-semibold">Payment Method</label>
                  <div className="mt-2 grid gap-3 md:grid-cols-3">
                    {[
                      "Cash",
                      "UPI",
                      "Card"
                    ].map((method) => (
                      <label key={method} className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50">
                        {method}
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={form.paymentMethod === method}
                          onChange={handleChange}
                          className="accent-purple-600"
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-purple-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Booking..." : "Confirm Booking"}
                </button>
              </form>
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Price Summary</h3>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-700">
                <span>Base price</span>
                <span>Rs {service.price}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-gray-700">
                <span>Emergency surge</span>
                <span>{form.isEmergency ? "1.5x" : "-"}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>Rs {displayPrice}</span>
              </div>
            </div>
            <NearbyProviders 
              serviceType={service.name} 
              userLocation={userLocation}
              selectedProvider={selectedProvider}
              onProviderSelect={setSelectedProvider}
              onProvidersLoad={handleProvidersLoad}
            />
            {selectedProvider && (
              <div className="rounded-2xl bg-green-50 p-6 border border-green-300 shadow-md">
                <h3 className="text-lg font-semibold text-green-900">✓ Provider Selected</h3>
                <div className="mt-3 space-y-2 text-sm text-green-800">
                  <div><strong>{selectedProvider.name}</strong> ⭐ {selectedProvider.rating}</div>
                  <div>📍 {selectedProvider.distanceKm} km away • ⏱️ ~{selectedProvider.etaMinutes} min ETA</div>
                  <button
                    onClick={() => setSelectedProvider(null)}
                    className="mt-2 text-xs text-green-700 hover:text-green-900 underline"
                  >
                    Clear selection (use auto-assign)
                  </button>
                </div>
              </div>
            )}
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900">Instant Assignment</h3>
              <p className="mt-3 text-sm text-gray-700">
                We auto-match you with the nearest verified provider, update ETA in real time, and keep you informed.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-600">⚡</div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Smart dispatch engine</div>
                  <div className="text-xs text-gray-600">Nearest provider in 30 seconds</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
