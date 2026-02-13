import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import api from "../utils/api.js";
import { getSocket } from "../utils/socket.js";

function formatEta(booking) {
  if (!booking?.etaMinutes) return "-";
  return `${booking.etaMinutes} mins`;
}

export default function ProviderDashboard() {
  const [provider, setProvider] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [actionForm, setActionForm] = useState({ note: "", etaMinutes: "" });
  const [status, setStatus] = useState("");

  const fetchAssignments = async () => {
    try {
      const response = await api.get("/provider/assignments");
      const bookings = response.data.bookings || [];
      setProvider(response.data.provider || null);
      setAssignments(bookings);
      if (bookings.length && !selectedId) {
        setSelectedId(bookings[0].bookingId);
      }
    } catch (err) {
      setStatus("Unable to load assignments");
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    let socketRef = null;
    const onNotification = (payload) => {
      if (["BOOKING_ASSIGNED", "BOOKING_CANCELLED", "BOOKING_ACCEPTED", "BOOKING_REJECTED"].includes(payload.type)) {
        fetchAssignments();
      }
    };

    getSocket()
      .then((socket) => {
        if (!socket) return;
        socketRef = socket;
        socket.on("notification:new", onNotification);
      })
      .catch(() => {});

    return () => {
      if (socketRef) {
        socketRef.off("notification:new", onNotification);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    let socketRef = null;

    const loadMessages = async () => {
      try {
        const response = await api.get(`/booking/${selectedId}/messages`);
        if (active) {
          setMessages(response.data.messages || []);
        }
      } catch (err) {
        if (active) {
          setStatus("Unable to load messages");
        }
      }
    };

    loadMessages();

    const handleMessage = (message) => {
      if (message.bookingId && message.bookingId !== selectedId) return;
      setMessages((prev) => [...prev, message]);
    };

    getSocket()
      .then((socket) => {
        if (!socket || !active) return;
        socketRef = socket;
        socket.emit("join-booking", selectedId);
        socket.on("message", handleMessage);
        socket.on("socket:error", (payload) => {
          setStatus(payload?.message || "Chat error");
        });
      })
      .catch(() => {
        if (!active) return;
        setStatus("Realtime chat unavailable");
      });

    return () => {
      active = false;
      if (socketRef) {
        socketRef.emit("leave-booking", selectedId);
        socketRef.off("message", handleMessage);
        socketRef.off("socket:error");
      }
    };
  }, [selectedId]);

  const handleSend = async (event) => {
    event.preventDefault();
    const text = messageInput.trim();
    if (!text || !selectedId) return;
    try {
      const socket = await getSocket();
      if (!socket) {
        setStatus("Realtime chat unavailable");
        return;
      }
      socket.emit("message", { bookingId: selectedId, text });
      setMessageInput("");
    } catch {
      setStatus("Realtime chat unavailable");
    }
  };

  const selectedBooking = assignments.find((booking) => booking.bookingId === selectedId);
  const available = Boolean(provider?.availability);
  const completedCount = assignments.filter((job) => job.status === "COMPLETED").length;
  const activeCount = assignments.filter((job) => job.status === "ACTIVE").length;
  const pendingCount = assignments.filter((job) => job.status === "PENDING").length;

  const handleToggleAvailability = async () => {
    try {
      const response = await api.post("/provider/availability", { availability: !available });
      setProvider((prev) => ({ ...prev, availability: response.data.provider.availability }));
    } catch (err) {
      setStatus(err.response?.data?.message || "Unable to update availability");
    }
  };

  const runAction = async (action) => {
    if (!selectedId) return;
    try {
      await api.post(`/provider/booking/${selectedId}/action`, {
        action,
        note: actionForm.note || undefined,
        etaMinutes: actionForm.etaMinutes ? Number(actionForm.etaMinutes) : undefined
      });
      setActionForm({ note: "", etaMinutes: "" });
      await fetchAssignments();
      if (action === "REJECT") {
        setSelectedId("");
        setMessages([]);
      }
    } catch (err) {
      setStatus(err.response?.data?.message || "Failed action");
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 shadow-card">
              <h2 className="text-2xl font-display font-bold text-white">🛠 Provider Command Center</h2>
              <p className="mt-2 text-sm text-slate-400">
                Live jobs, customer chats, and real-time updates.
              </p>
              <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/5 p-4">
                <div>
                  <div className="text-sm text-slate-400">Availability</div>
                  <div className="text-lg font-semibold text-white">
                    {available ? "Accepting new jobs" : "Paused"}
                  </div>
                </div>
                <button
                  onClick={handleToggleAvailability}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    available ? "bg-accent-500 text-white" : "bg-white/10 text-slate-200"
                  }`}
                >
                  {available ? "Go Offline" : "Go Online"}
                </button>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 shadow-card">
              <h3 className="text-lg font-semibold text-white">📦 Assigned Jobs</h3>
              {status ? <p className="mt-3 text-xs text-red-200">{status}</p> : null}
              <div className="mt-4 space-y-3">
                {assignments.length === 0 ? (
                  <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-400">
                    No active assignments yet.
                  </div>
                ) : (
                  assignments.map((job) => (
                    <button
                      type="button"
                      key={job.bookingId}
                      onClick={() => setSelectedId(job.bookingId)}
                      className={`w-full rounded-2xl bg-white/5 p-4 text-left transition ${
                        selectedId === job.bookingId ? "ring-2 ring-primary-500" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-slate-400">{job.serviceType}</div>
                          <div className="text-sm font-semibold text-white">{job.bookingId}</div>
                        </div>
                        <span className="rounded-full bg-primary-500/20 px-3 py-1 text-xs text-primary-200">
                          {job.status}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        Customer: {job.customer?.name || "-"} | ETA: {formatEta(job)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 shadow-card">
              <h3 className="text-lg font-semibold text-white">💬 Live Chat</h3>
              {selectedBooking ? (
                <p className="mt-2 text-xs text-slate-400">
                  Chatting with {selectedBooking.customer?.name || "Customer"}
                </p>
              ) : null}
              <div className="mt-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="rounded-2xl bg-white/5 p-3 text-sm text-slate-400">
                    No messages yet.
                  </div>
                ) : (
                  messages.map((message, idx) => (
                    <div key={idx} className="rounded-2xl bg-white/5 p-3 text-sm text-slate-200">
                      <span className="font-semibold text-primary-200">
                        {message.senderRole === "PROVIDER" ? "You" : message.senderName || "Customer"}:
                      </span>{" "}
                      {message.text}
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSend} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  placeholder="Type a message"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  Send
                </button>
              </form>
              {selectedBooking ? (
                <div className="mt-4 space-y-3 rounded-2xl border border-white/10 p-3">
                  <div className="text-sm font-semibold text-white">⚡ Quick Actions</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => runAction("ACCEPT")}
                      className="rounded-full bg-accent-500 px-3 py-1 text-xs font-semibold text-white"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => runAction("REJECT")}
                      className="rounded-full bg-emergency px-3 py-1 text-xs font-semibold text-white"
                    >
                      Reject
                    </button>
                  </div>
                  <input
                    type="text"
                    value={actionForm.note}
                    onChange={(event) => setActionForm((prev) => ({ ...prev, note: event.target.value }))}
                    placeholder="Delivery update note"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-slate-500"
                  />
                  <input
                    type="number"
                    value={actionForm.etaMinutes}
                    onChange={(event) => setActionForm((prev) => ({ ...prev, etaMinutes: event.target.value }))}
                    placeholder="Updated ETA in minutes"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-slate-500"
                  />
                  <button
                    onClick={() => runAction("UPDATE")}
                    className="w-full rounded-full bg-primary-500 py-2 text-xs font-semibold text-white"
                  >
                    Update Delivery Info
                  </button>
                </div>
              ) : null}
            </div>

            <div className="glass-panel rounded-3xl p-6 shadow-card">
              <h3 className="text-lg font-semibold text-white">📊 Today Summary</h3>
              <div className="mt-4 grid gap-4">
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-xs uppercase text-slate-400">Completed</div>
                  <div className="mt-2 text-lg font-semibold text-white">{completedCount}</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-xs uppercase text-slate-400">Active</div>
                  <div className="mt-2 text-lg font-semibold text-white">{activeCount}</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-xs uppercase text-slate-400">Pending</div>
                  <div className="mt-2 text-lg font-semibold text-white">{pendingCount}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
