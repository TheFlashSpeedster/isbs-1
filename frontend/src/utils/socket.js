let socket = null;
let loader = null;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function loadSocketClient() {
  if (window.io) {
    return Promise.resolve(window.io);
  }

  if (loader) {
    return loader;
  }

  loader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${API_BASE_URL}/socket.io/socket.io.js`;
    script.async = true;

    script.onload = () => resolve(window.io);
    script.onerror = () => reject(new Error("Failed to load socket client"));

    document.head.appendChild(script);
  });

  return loader;
}

export async function getSocket() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const io = await loadSocketClient();
  if (!io) return null;

  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(API_BASE_URL, {
    auth: { token },
    transports: ["websocket"],
    withCredentials: false
  });

  return socket;
}

export function resetSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
