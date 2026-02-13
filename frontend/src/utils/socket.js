let socket = null;
let loader = null;

function loadSocketClient() {
  if (window.io) {
    return Promise.resolve(window.io);
  }

  if (loader) {
    return loader;
  }

  loader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "http://localhost:4000/socket.io/socket.io.js";
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

  socket = io("http://localhost:4000", {
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
