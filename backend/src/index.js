import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { authRequired } from "./middleware/auth.js";
import Booking from "./models/Booking.js";
import Notification from "./models/Notification.js";
import Provider from "./models/Provider.js";
import User from "./models/User.js";
import authRoutes from "./routes/auth.js";
import bookingRoutes from "./routes/booking.js";
import servicesRoutes from "./routes/services.js";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.set("io", io);

app.get("/", (req, res) => {
  res.json({ status: "Instant Service Booking API running" });
});

app.use(authRoutes);
app.use(servicesRoutes);

// Public nearby providers endpoint (no auth required)
const serviceAliases = {
  Electric: ["Electric", "Electrician"],
  Electrician: ["Electric", "Electrician"],
  Plumbing: ["Plumbing", "Plumber"],
  Plumber: ["Plumbing", "Plumber"],
  Repair: ["Repair"],
  Cleaning: ["Cleaning"],
  Painting: ["Painting"],
  Shifting: ["Shifting"],
  Cooking: ["Cooking"],
  Misc: ["Misc"]
};

function resolveServiceTypes(serviceType) {
  return serviceAliases[serviceType] || [serviceType];
}

app.post("/nearby-providers", async (req, res) => {
  try {
    const { serviceType, userLocation } = req.body;
    
    if (!serviceType) {
      return res.status(400).json({ message: "serviceType is required" });
    }

    const location = userLocation || { latitude: 28.6139, longitude: 77.209 };
    const serviceTypes = resolveServiceTypes(serviceType);
    const providers = await Provider.find({ serviceType: { $in: serviceTypes }, availability: true })
      .populate("user", "name phone")
      .lean();

    if (!providers.length) {
      return res.status(404).json({ 
        message: "No providers available for this service",
        providers: [] 
      });
    }

    // Haversine distance calculation
    function haversineDistanceKm(loc1, loc2) {
      const R = 6371; // Earth's radius in km
      const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
      const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    // Calculate ETA
    function computeEta(distanceKm) {
      const avgSpeed = 30;
      const distanceMinutes = Math.ceil((distanceKm / avgSpeed) * 60);
      return Math.max(15, distanceMinutes);
    }

    const nearbyProviders = providers
      .map((provider) => {
        const distanceKm = haversineDistanceKm(location, provider.location);
        const etaMinutes = computeEta(distanceKm);
        
        return {
          id: provider._id,
          name: provider.name,
          serviceType: provider.serviceType,
          rating: provider.rating,
          imageUrl: provider.imageUrl,
          location: provider.location,
          distanceKm: Number(distanceKm.toFixed(2)),
          etaMinutes,
          availability: provider.availability
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 10);

    return res.json({
      providers: nearbyProviders,
      count: nearbyProviders.length,
      userLocation: location
    });
  } catch (err) {
    console.error("Error finding nearby providers:", err);
    return res.status(500).json({ message: "Failed to find nearby providers" });
  }
});

app.use(authRequired, bookingRoutes);

const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGO_URI;

async function canAccessBooking(bookingId, user) {
  const booking = await Booking.findOne({ bookingId });
  if (!booking) {
    return null;
  }

  if (user.role === "ADMIN") {
    return booking;
  }

  if (booking.user.toString() === user.id) {
    return booking;
  }

  if (user.role === "PROVIDER") {
    const provider = await Provider.findOne({ user: user.id });
    if (provider && booking.provider.toString() === provider._id.toString()) {
      return booking;
    }
  }

  return null;
}

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("Missing token"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).lean();
    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email
    };

    return next();
  } catch (err) {
    return next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  socket.on("join-booking", async (bookingId) => {
    if (!bookingId) return;
    const booking = await canAccessBooking(bookingId, socket.user);
    if (!booking) {
      socket.emit("socket:error", { message: "Access denied" });
      return;
    }
    socket.join(bookingId);
  });

  socket.on("leave-booking", (bookingId) => {
    if (!bookingId) return;
    socket.leave(bookingId);
  });

  socket.on("message", async ({ bookingId, text }) => {
    if (!bookingId || !text || !text.trim()) {
      return;
    }

    const booking = await canAccessBooking(bookingId, socket.user);
    if (!booking) {
      socket.emit("socket:error", { message: "Access denied" });
      return;
    }

    const provider = await Provider.findById(booking.provider).lean();
    const isProvider = provider && provider.user && provider.user.toString() === socket.user.id;

    const message = {
      senderRole: isProvider ? "PROVIDER" : "CUSTOMER",
      senderId: socket.user.id,
      senderName: socket.user.name,
      text: text.trim(),
      sentAt: new Date()
    };

    booking.messages.push(message);
    await booking.save();

    io.to(bookingId).emit("message", { ...message, bookingId });

    const recipientId = isProvider ? booking.user.toString() : provider?.user?.toString();
    if (recipientId) {
      const notification = await Notification.create({
        recipient: recipientId,
        bookingId,
        type: "NEW_MESSAGE",
        title: "New message",
        message: `${socket.user.name}: ${text.trim()}`
      });

      io.to(`user:${recipientId}`).emit("notification:new", {
        id: notification._id,
        bookingId: notification.bookingId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actionType: notification.actionType,
        read: notification.read,
        createdAt: notification.createdAt
      });
    }
  });
});

async function connect() {
  if (!mongoUri) {
    console.error("Missing MONGO_URI in environment");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");

  httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

connect().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
