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
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async () => {
    setLoading(true);
    setStatus("");
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
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12">
        {status ? (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {status}
          </div>
        ) : null}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">🛠 Provider Command Center</h2>
              <p className="mt-2 text-sm text-gray-600">
                Live jobs, customer chats, and real-time updates.
              </p>
              <div className="mt-6 flex items-center justify-between rounded-lg bg-purple-50 p-4 border border-purple-200">
                <div>
                  <div className="text-sm text-gray-600">Availability</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {available ? "Accepting new jobs" : "Paused"}
                  </div>
                </div>
                <button
                  onClick={handleToggleAvailability}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    available ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                  }`}
                >
                  {available ? "Go Offline" : "Go Online"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">📦 Assigned Jobs</h3>
              <div className="mt-4 space-y-3">
                {loading ? (
                  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 border border-gray-200">
                    Loading assignments...
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 border border-gray-200">
                    No active assignments yet.
                  </div>
                ) : (
                  assignments.map((job) => (
                    <button
                      type="button"
                      key={job.bookingId}
                      onClick={() => setSelectedId(job.bookingId)}
                      className={`w-full rounded-lg bg-gray-50 p-4 text-left transition border ${
                        selectedId === job.bookingId ? "ring-2 ring-purple-500 border-purple-300 bg-purple-50" : "border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-600">{job.serviceType}</div>
                          <div className="text-sm font-semibold text-gray-900">{job.bookingId}</div>
                        </div>
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700 font-medium">
                          {job.status}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Customer: {job.customer?.name || "-"} | ETA: {formatEta(job)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">💬 Live Chat</h3>
              {selectedBooking ? (
                <p className="mt-2 text-xs text-gray-600">
                  Chatting with {selectedBooking.customer?.name || "Customer"}
                </p>
              ) : null}
              <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                {!selectedBooking ? (
                  <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 border border-gray-200">
                    Select a booking to view messages.
                  </div>
                ) : messages.length === 0 ? (
                  <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 border border-gray-200">
                    No messages yet.
                  </div>
                ) : (
                  messages.map((message, idx) => (
                    <div key={idx} className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 border border-gray-200">
                      <span className="font-semibold text-purple-600">
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
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                >
                  Send
                </button>
              </form>
              {selectedBooking ? (
                <div className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-sm font-semibold text-gray-900">⚡ Quick Actions</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => runAction("ACCEPT")}
                      className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => runAction("REJECT")}
                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                  <input
                    type="text"
                    value={actionForm.note}
                    onChange={(event) => setActionForm((prev) => ({ ...prev, note: event.target.value }))}
                    placeholder="Delivery update note"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    value={actionForm.etaMinutes}
                    onChange={(event) => setActionForm((prev) => ({ ...prev, etaMinutes: event.target.value }))}
                    placeholder="Updated ETA in minutes"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => runAction("UPDATE")}
                    className="w-full rounded-lg bg-purple-600 py-2 text-xs font-semibold text-white hover:bg-purple-700"
                  >
                    Update Delivery Info
                  </button>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">📊 Today Summary</h3>
              <div className="mt-4 grid gap-4">
                <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                  <div className="text-xs uppercase text-gray-600 font-semibold">Completed</div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">{completedCount}</div>
                </div>
                <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                  <div className="text-xs uppercase text-gray-600 font-semibold">Active</div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">{activeCount}</div>
                </div>
                <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                  <div className="text-xs uppercase text-gray-600 font-semibold">Pending</div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">{pendingCount}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
