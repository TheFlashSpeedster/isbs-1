import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import CountdownTimer from "../components/CountdownTimer.jsx";
import api from "../utils/api.js";
import { getSocket } from "../utils/socket.js";

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
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center text-white">Loading booking...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center text-red-200">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="glass-panel animate-rise rounded-3xl p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">📋 Live Booking Room</h2>
                  <p className="mt-1 text-sm text-slate-400">Booking ID: {booking?.bookingId}</p>
                </div>
                <span className="rounded-full bg-accent-500/20 px-3 py-1 text-xs text-accent-200">{booking?.status}</span>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-xs uppercase text-slate-400">🕒 ETA</div>
                  <div className="mt-2 text-lg font-semibold text-white">{booking?.etaMinutes} mins</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-xs uppercase text-slate-400">📍 Distance</div>
                  <div className="mt-2 text-lg font-semibold text-white">{booking?.distanceKm} km away</div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                {booking?.etaAt ? <CountdownTimer target={booking.etaAt} /> : null}
                <span className="text-sm text-slate-300">Provider is on the way</span>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 shadow-card">
              <h3 className="text-lg font-semibold text-white">💬 Real-time Chat</h3>
              {messageStatus ? <p className="mt-2 text-xs text-red-200">{messageStatus}</p> : null}
              <div className="mt-4 max-h-72 space-y-3 overflow-auto">
                {messages.length === 0 ? (
                  <div className="rounded-2xl bg-white/5 p-3 text-sm text-slate-400">No messages yet. Start the conversation.</div>
                ) : (
                  messages.map((message, idx) => (
                    <div key={`${message.sentAt}-${idx}`} className="rounded-2xl bg-white/5 p-3 text-sm text-slate-200">
                      <span className="font-semibold text-primary-200">{message.senderName || message.senderRole}:</span>{" "}
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
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500"
                />
                <button type="submit" className="rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white">
                  Send
                </button>
              </form>
            </div>

            {!isProviderUser ? (
              <div className="glass-panel rounded-3xl p-6 shadow-card">
                <h3 className="text-lg font-semibold text-white">⭐ Rate Service</h3>
                {feedbackStatus ? <p className="mt-3 text-sm text-accent-200">{feedbackStatus}</p> : null}
                <form className="mt-4 space-y-3" onSubmit={handleFeedback}>
                  <select
                    value={rating}
                    onChange={(event) => setRating(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
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
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500"
                  />
                  <button type="submit" className="w-full rounded-full bg-accent-500 px-4 py-2 text-sm font-semibold text-white">
                    Submit Review
                  </button>
                </form>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            {!isProviderUser ? (
              <div className="glass-panel rounded-3xl p-6 shadow-card">
                <h3 className="text-lg font-semibold text-white">👷 Assigned Provider</h3>
                <div className="mt-4 flex items-center gap-4">
                  <img src={provider?.imageUrl} alt={provider?.name} className="h-16 w-16 rounded-2xl object-cover" />
                  <div>
                    <div className="text-base font-semibold text-white">{provider?.name}</div>
                    <div className="text-sm text-slate-400">Rating {provider?.rating}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-6 shadow-card">
                <h3 className="text-lg font-semibold text-white">👤 Customer Details</h3>
                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <div>Name: {customer?.name || "-"}</div>
                  <div>Phone: {customer?.phone || "-"}</div>
                </div>
              </div>
            )}

            {isProviderUser ? (
              <div className="glass-panel rounded-3xl p-6 shadow-card">
                <h3 className="text-lg font-semibold text-white">⚡ Quick Actions</h3>
                {providerActionStatus ? <p className="mt-3 text-sm text-accent-200">{providerActionStatus}</p> : null}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button onClick={() => providerAction("ACCEPT")} className="rounded-full bg-accent-500 py-2 text-sm font-semibold text-white">
                    Accept
                  </button>
                  <button onClick={() => providerAction("REJECT")} className="rounded-full bg-emergency py-2 text-sm font-semibold text-white">
                    Reject
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Update note"
                    value={providerUpdate.note}
                    onChange={(event) => setProviderUpdate((prev) => ({ ...prev, note: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500"
                  />
                  <input
                    type="number"
                    placeholder="New ETA (minutes)"
                    value={providerUpdate.etaMinutes}
                    onChange={(event) => setProviderUpdate((prev) => ({ ...prev, etaMinutes: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500"
                  />
                  <button onClick={() => providerAction("UPDATE")} className="w-full rounded-full bg-primary-500 py-2 text-sm font-semibold text-white">
                    Update Delivery Info
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-6 shadow-card">
                <h3 className="text-lg font-semibold text-white">💳 Payment</h3>
                <div className="mt-4 text-sm text-slate-300">Total: Rs {booking?.price}</div>
                <div className="mt-2 text-xs text-slate-400">Method: {booking?.paymentMethod || "Cash"}</div>
                <div className="mt-2 text-xs text-slate-400">Status: {booking?.paymentStatus || "PENDING"}</div>
                {booking?.paymentStatus !== "PAID" ? (
                  <button onClick={handlePay} className="mt-4 w-full rounded-full bg-accent-500 py-2 text-sm font-semibold text-white">
                    Pay Now (Test)
                  </button>
                ) : (
                  <div className="mt-4 rounded-2xl bg-white/5 p-3 text-xs text-slate-300">Paid - Txn {booking?.paymentTxnId}</div>
                )}

                {canCancel ? (
                  <button
                    onClick={handleCancel}
                    className="mt-4 w-full rounded-full border border-white/10 py-2 text-sm font-semibold text-white hover:bg-white/10"
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
