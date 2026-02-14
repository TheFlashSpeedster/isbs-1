import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { GoogleMap, LoadScript, Marker, Polyline } from "@react-google-maps/api";
import Navbar from "../components/Navbar.jsx";
import CountdownTimer from "../components/CountdownTimer.jsx";
import api from "../utils/api.js";
import { getSocket } from "../utils/socket.js";

const trackingMapStyle = {
  width: "100%",
  height: "260px",
  borderRadius: "12px"
};

export default function TrackingPage() {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isProviderUser = user?.role === "PROVIDER";

  const [data, setData] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [messageStatus, setMessageStatus] = useState("");
  const [rating, setRating] = useState("5");
  const [review, setReview] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [providerUpdate, setProviderUpdate] = useState({ note: "", etaMinutes: "" });
  const [providerActionStatus, setProviderActionStatus] = useState("");

  const booking = data?.booking;
  const provider = data?.provider;
  const customer = data?.customer;
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  const customerPosition = useMemo(() => {
    if (!customer?.location) return null;
    const lat = Number(customer.location.latitude);
    const lng = Number(customer.location.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  }, [customer?.location]);

  const providerPosition = useMemo(() => {
    if (!provider?.location) return null;
    const lat = Number(provider.location.latitude);
    const lng = Number(provider.location.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  }, [provider?.location]);

  const mapCenter = useMemo(() => {
    if (customerPosition && providerPosition) {
      return {
        lat: (customerPosition.lat + providerPosition.lat) / 2,
        lng: (customerPosition.lng + providerPosition.lng) / 2
      };
    }
    return customerPosition || providerPosition || { lat: 31.252, lng: 75.705 };
  }, [customerPosition, providerPosition]);

  const handleMapLoad = useCallback((mapInstance) => {
    if (!window.google || !customerPosition || !providerPosition) return;
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(customerPosition);
    bounds.extend(providerPosition);
    mapInstance.fitBounds(bounds);
  }, [customerPosition, providerPosition]);

  const canCancel = useMemo(() => ["PENDING", "ACTIVE"].includes(booking?.status), [booking?.status]);

  useEffect(() => {
    let active = true;
    let socketRef = null;

    const fetchBooking = async () => {
      try {
        const response = await api.get(`/booking/${bookingId}`);
        if (!active) return;
        setData(response.data);
      } catch (err) {
        if (!active) return;
        setError("Unable to load booking");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    const fetchMessages = async () => {
      try {
        const response = await api.get(`/booking/${bookingId}/messages`);
        if (!active) return;
        setMessages(response.data.messages || []);
      } catch (err) {
        if (!active) return;
        setMessageStatus("Unable to load messages");
      }
    };

    const onMessage = (incoming) => {
      if (incoming.bookingId !== bookingId) return;
      setMessages((prev) => [...prev, incoming]);
    };

    const onBookingUpdate = (payload) => {
      if (payload.bookingId !== bookingId) return;
      setData((prev) => ({ ...prev, booking: payload.booking }));
    };

    fetchBooking();
    fetchMessages();

    getSocket()
      .then((socket) => {
        if (!active || !socket) return;
        socketRef = socket;
        socket.emit("join-booking", bookingId);
        socket.on("message", onMessage);
        socket.on("booking:update", onBookingUpdate);
        socket.on("socket:error", (payload) => {
          setMessageStatus(payload?.message || "Chat error");
        });
      })
      .catch(() => {
        if (!active) return;
        setMessageStatus("Realtime chat unavailable");
      });

    return () => {
      active = false;
      if (socketRef) {
        socketRef.emit("leave-booking", bookingId);
        socketRef.off("message", onMessage);
        socketRef.off("booking:update", onBookingUpdate);
        socketRef.off("socket:error");
      }
    };
  }, [bookingId]);

  const handleCancel = async () => {
    try {
      await api.post(`/booking/${bookingId}/cancel`);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to cancel");
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    setMessageStatus("");
    const text = messageInput.trim();
    if (!text) return;

    try {
      const socket = await getSocket();
      if (!socket) {
        setMessageStatus("Realtime chat not connected");
        return;
      }
      socket.emit("message", { bookingId, text });
      setMessageInput("");
    } catch {
      setMessageStatus("Realtime chat not connected");
    }
  };

  const handlePay = async () => {
    try {
      const response = await api.post(`/booking/${bookingId}/pay`, {
        paymentMethod: booking?.paymentMethod || "Cash"
      });

      setData((prev) => ({
        ...prev,
        booking: {
          ...prev.booking,
          paymentStatus: response.data.paymentStatus,
          paymentTxnId: response.data.paymentTxnId,
          paidAt: response.data.paidAt,
          paymentMethod: response.data.paymentMethod
        }
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed");
    }
  };

  const handleFeedback = async (event) => {
    event.preventDefault();
    setFeedbackStatus("");
    try {
      await api.post(`/booking/${bookingId}/rate`, {
        rating: Number(rating),
        review
      });
      setFeedbackStatus("Review submitted");
    } catch (err) {
      setFeedbackStatus(err.response?.data?.message || "Unable to submit review");
    }
  };

  const providerAction = async (action) => {
    setProviderActionStatus("");
    try {
      const response = await api.post(`/provider/booking/${bookingId}/action`, {
        action,
        note: providerUpdate.note,
        etaMinutes: providerUpdate.etaMinutes ? Number(providerUpdate.etaMinutes) : undefined
      });
      setData((prev) => ({ ...prev, booking: response.data.booking }));
      setProviderActionStatus(response.data.message || "Action completed");
      if (action === "REJECT") {
        navigate("/dashboard");
      }
    } catch (err) {
      setProviderActionStatus(err.response?.data?.message || "Action failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center text-gray-900">Loading booking...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200 animate-rise">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">📋 Live Booking Room</h2>
                  <p className="mt-1 text-sm text-gray-600">Booking ID: {booking?.bookingId}</p>
                </div>
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700 font-medium">{booking?.status}</span>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-purple-50 p-4 border border-purple-200">
                  <div className="text-xs uppercase text-gray-600 font-semibold">🕒 ETA</div>
                  <div className="mt-2 text-lg font-bold text-gray-900">{booking?.etaMinutes} mins</div>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                  <div className="text-xs uppercase text-gray-600 font-semibold">📍 Distance</div>
                  <div className="mt-2 text-lg font-bold text-gray-900">{booking?.distanceKm} km away</div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                {booking?.etaAt ? <CountdownTimer target={booking.etaAt} /> : null}
                <span className="text-sm text-gray-700">Provider is on the way</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">💬 Real-time Chat</h3>
              {messageStatus ? <p className="mt-2 text-xs text-red-600">{messageStatus}</p> : null}
              <div className="mt-4 max-h-72 space-y-3 overflow-auto">
                {messages.length === 0 ? (
                  <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 border border-gray-200">No messages yet. Start the conversation.</div>
                ) : (
                  messages.map((message, idx) => (
                    <div key={`${message.sentAt}-${idx}`} className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 border border-gray-200">
                      <span className="font-semibold text-purple-600">{message.senderName || message.senderRole}:</span>{" "}
                      {message.text}
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  placeholder="Type a message"
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button type="submit" className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
                  Send
                </button>
              </form>
            </div>

            {!isProviderUser ? (
              <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">⭐ Rate Service</h3>
                {feedbackStatus ? <p className="mt-3 text-sm text-purple-600">{feedbackStatus}</p> : null}
                <form className="mt-4 space-y-3" onSubmit={handleFeedback}>
                  <select
                    value={rating}
                    onChange={(event) => setRating(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Great</option>
                    <option value="3">3 - Okay</option>
                    <option value="2">2 - Needs work</option>
                    <option value="1">1 - Poor</option>
                  </select>
                  <textarea
                    rows="3"
                    value={review}
                    onChange={(event) => setReview(event.target.value)}
                    placeholder="Share review"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button type="submit" className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
                    Submit Review
                  </button>
                </form>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">🧭 Live Location</h3>
              <p className="mt-1 text-xs text-gray-600">Your location and the provider on the same map.</p>
              <div className="mt-4">
                {!GOOGLE_MAPS_API_KEY ? (
                  <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-800">
                    Add VITE_GOOGLE_MAPS_API_KEY in .env to enable live tracking map.
                  </div>
                ) : !customerPosition && !providerPosition ? (
                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600">
                    Location data is not available for this booking.
                  </div>
                ) : (
                  <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                      mapContainerStyle={trackingMapStyle}
                      center={mapCenter}
                      zoom={14}
                      onLoad={handleMapLoad}
                      options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: true
                      }}
                    >
                      {customerPosition ? (
                        <Marker
                          position={customerPosition}
                          title="Your Location"
                          icon={window.google ? {
                            url: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3e%3ccircle cx='12' cy='12' r='10' fill='%233B82F6' stroke='white' stroke-width='3'/%3e%3c/svg%3e",
                            scaledSize: new window.google.maps.Size(24, 24)
                          } : undefined}
                        />
                      ) : null}
                      {providerPosition ? (
                        <Marker
                          position={providerPosition}
                          title="Service Provider"
                          icon={window.google ? {
                            url: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 24 24'%3e%3ccircle cx='12' cy='12' r='10' fill='%239333EA' stroke='white' stroke-width='3'/%3e%3c/svg%3e",
                            scaledSize: new window.google.maps.Size(26, 26)
                          } : undefined}
                        />
                      ) : null}
                      {customerPosition && providerPosition ? (
                        <Polyline
                          path={[customerPosition, providerPosition]}
                          options={{
                            strokeColor: "#7C3AED",
                            strokeOpacity: 0.8,
                            strokeWeight: 4
                          }}
                        />
                      ) : null}
                    </GoogleMap>
                  </LoadScript>
                )}
              </div>
            </div>
            {!isProviderUser ? (
              <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">👷 Assigned Provider</h3>
                <div className="mt-4 flex items-center gap-4">
                  <img src={provider?.imageUrl} alt={provider?.name} className="h-16 w-16 rounded-lg object-cover" />
                  <div>
                    <div className="text-base font-semibold text-gray-900">{provider?.name}</div>
                    <div className="text-sm text-gray-600">Rating {provider?.rating}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">👤 Customer Details</h3>
                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  <div>Name: {customer?.name || "-"}</div>
                  <div>Phone: {customer?.phone || "-"}</div>
                </div>
              </div>
            )}

            {isProviderUser ? (
              <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">⚡ Quick Actions</h3>
                {providerActionStatus ? <p className="mt-3 text-sm text-purple-600">{providerActionStatus}</p> : null}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button onClick={() => providerAction("ACCEPT")} className="rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700">
                    Accept
                  </button>
                  <button onClick={() => providerAction("REJECT")} className="rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700">
                    Reject
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Update note"
                    value={providerUpdate.note}
                    onChange={(event) => setProviderUpdate((prev) => ({ ...prev, note: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="New ETA (minutes)"
                    value={providerUpdate.etaMinutes}
                    onChange={(event) => setProviderUpdate((prev) => ({ ...prev, etaMinutes: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button onClick={() => providerAction("UPDATE")} className="w-full rounded-lg bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-700">
                    Update Delivery Info
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">💳 Payment</h3>
                <div className="mt-4 text-sm text-gray-700">Total: Rs {booking?.price}</div>
                <div className="mt-2 text-xs text-gray-600">Method: {booking?.paymentMethod || "Cash"}</div>
                <div className="mt-2 text-xs text-gray-600">Status: {booking?.paymentStatus || "PENDING"}</div>
                {booking?.paymentStatus !== "PAID" ? (
                  <button onClick={handlePay} className="mt-4 w-full rounded-lg bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-700">
                    Pay Now (Test)
                  </button>
                ) : (
                  <div className="mt-4 rounded-lg bg-green-50 p-3 text-xs text-green-700 border border-green-200">Paid - Txn {booking?.paymentTxnId}</div>
                )}

                {canCancel ? (
                  <button
                    onClick={handleCancel}
                    className="mt-4 w-full rounded-lg border border-gray-300 bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel Booking
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
