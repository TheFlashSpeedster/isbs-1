import express from "express";
import Booking from "../models/Booking.js";
import Notification from "../models/Notification.js";
import Provider from "../models/Provider.js";
import User from "../models/User.js";
import { haversineDistanceKm } from "../utils/distance.js";

const router = express.Router();

const basePrices = {
  Electrician: 399,
  Cooking: 249,
  Plumber: 349,
  Misc: 299,
  Cleaning: 249,
  Repair: 399,
  Painting: 349,
  Shifting: 499,
  Plumbing: 349,
  Electric: 399
};

function buildBookingId() {
  const random = Math.floor(100 + Math.random() * 900);
  return `SRV${Date.now()}${random}`;
}

function computeEta(distanceKm, isEmergency) {
  const avgSpeed = Number(process.env.AVG_SPEED_KMH || 30);
  const distanceMinutes = Math.ceil((distanceKm / avgSpeed) * 60);
  const baseMinutes = isEmergency ? 5 : 15;
  const etaMinutes = isEmergency ? baseMinutes : Math.max(baseMinutes, distanceMinutes);
  const etaAt = new Date(Date.now() + etaMinutes * 60 * 1000);
  return { etaMinutes, etaAt };
}

async function resolveBookingForUser(bookingId, user) {
  const booking = await Booking.findOne({ bookingId })
    .populate("provider")
    .populate("user");

  if (!booking) {
    return null;
  }

  if (user.role === "ADMIN") {
    return booking;
  }

  if (booking.user && booking.user._id.toString() === user.id) {
    return booking;
  }

  if (user.role === "PROVIDER") {
    const provider = await Provider.findOne({ user: user.id });
    if (provider && booking.provider && booking.provider._id.toString() === provider._id.toString()) {
      return booking;
    }
  }

  return null;
}

async function notify(req, payload) {
  const notification = await Notification.create(payload);
  const io = req.app.get("io");
  if (io) {
    io.to(`user:${payload.recipient.toString()}`).emit("notification:new", {
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
  return notification;
}

function toBookingPayload(booking) {
  return {
    bookingId: booking.bookingId,
    serviceType: booking.serviceType,
    status: booking.status,
    etaAt: booking.etaAt,
    etaMinutes: booking.etaMinutes,
    distanceKm: booking.distanceKm,
    price: booking.price,
    isEmergency: booking.isEmergency,
    paymentMethod: booking.paymentMethod,
    paymentStatus: booking.paymentStatus,
    paymentTxnId: booking.paymentTxnId,
    paidAt: booking.paidAt,
    rating: booking.rating,
    review: booking.review,
    createdAt: booking.createdAt
  };
}

// Find nearby providers endpoint
router.post("/nearby-providers", async (req, res) => {
  try {
    const { serviceType, userLocation } = req.body;
    
    if (!serviceType) {
      return res.status(400).json({ message: "serviceType is required" });
    }

    const location = userLocation || { latitude: 28.6139, longitude: 77.209 };
    const providers = await Provider.find({ serviceType, availability: true })
      .populate("user", "name phone")
      .lean();

    if (!providers.length) {
      return res.status(404).json({ 
        message: "No providers available for this service",
        providers: [] 
      });
    }

    const nearbyProviders = providers
      .map((provider) => {
        const distanceKm = haversineDistanceKm(location, provider.location);
        const { etaMinutes } = computeEta(distanceKm, false);
        
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
      .slice(0, 10); // Return top 10 nearest providers

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

router.post("/book", async (req, res) => {
  try {
    if (req.user.role === "PROVIDER") {
      return res.status(403).json({ message: "Providers cannot create customer bookings" });
    }

    const { serviceType, userLocation, isEmergency, paymentMethod, preferredProviderId } = req.body;
    if (!serviceType) {
      return res.status(400).json({ message: "serviceType is required" });
    }

    const location = userLocation || { latitude: 28.6139, longitude: 77.209 };
    
    let assigned = null;
    let distanceKm = 0;

    // If customer selected a specific provider, try to assign them
    if (preferredProviderId) {
      const preferredProvider = await Provider.findOneAndUpdate(
        { _id: preferredProviderId, serviceType, availability: true },
        { availability: false },
        { new: true }
      );

      if (preferredProvider) {
        assigned = preferredProvider;
        distanceKm = Number(haversineDistanceKm(location, preferredProvider.location).toFixed(2));
      } else {
        // Preferred provider not available, fall back to auto-assign
        console.log("Preferred provider not available, falling back to auto-assign");
      }
    }

    // If no provider assigned yet (either no preference or preferred was unavailable), auto-assign nearest
    if (!assigned) {
      const providers = await Provider.find({ serviceType, availability: true }).lean();

      if (!providers.length) {
        return res.status(404).json({ message: "No providers available" });
      }

      const ranked = providers
        .map((provider) => ({
          provider,
          distanceKm: haversineDistanceKm(location, provider.location)
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);

      for (const candidate of ranked) {
        const updated = await Provider.findOneAndUpdate(
          { _id: candidate.provider._id, availability: true },
          { availability: false },
          { new: true }
        );

        if (updated) {
          assigned = updated;
          distanceKm = Number(candidate.distanceKm.toFixed(2));
          break;
        }
      }
    }

    if (!assigned) {
      return res.status(409).json({ message: "Providers became unavailable" });
    }

    const { etaMinutes, etaAt } = computeEta(distanceKm, Boolean(isEmergency));
    const basePrice = basePrices[serviceType] || 299;
    const price = isEmergency ? Math.round(basePrice * 1.5) : basePrice;

    const booking = await Booking.create({
      bookingId: buildBookingId(),
      user: req.user.id,
      provider: assigned._id,
      serviceType,
      status: "PENDING",
      etaAt,
      etaMinutes,
      distanceKm,
      price,
      userLocation: location,
      isEmergency: Boolean(isEmergency),
      paymentMethod: paymentMethod || "Cash"
    });

    if (assigned.user) {
      await notify(req, {
        recipient: assigned.user,
        bookingId: booking.bookingId,
        type: "BOOKING_ASSIGNED",
        title: "New booking request",
        message: `${serviceType} booking needs your action`,
        actionType: "RESPOND_BOOKING"
      });
    }

    await notify(req, {
      recipient: req.user.id,
      bookingId: booking.bookingId,
      type: "BOOKING_CREATED",
      title: "Booking created",
      message: `Booking ${booking.bookingId} has been assigned and is waiting for provider acceptance`
    });

    return res.status(201).json({
      booking: {
        id: booking._id,
        ...toBookingPayload(booking)
      },
      provider: {
        id: assigned._id,
        name: assigned.name,
        rating: assigned.rating,
        imageUrl: assigned.imageUrl,
        distanceKm,
        status: "Awaiting provider acceptance"
      }
    });
  } catch (err) {
    console.error("Booking error:", err);
    return res.status(500).json({ message: "Booking failed" });
  }
});

router.get("/booking/:id", async (req, res) => {
  try {
    const booking = await resolveBookingForUser(req.params.id, req.user);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.json({
      booking: toBookingPayload(booking),
      provider: booking.provider
        ? {
            id: booking.provider._id,
            name: booking.provider.name,
            rating: booking.provider.rating,
            imageUrl: booking.provider.imageUrl,
            location: booking.provider.location
          }
        : null,
      customer: booking.user
        ? {
            id: booking.user._id,
            name: booking.user.name,
            phone: booking.user.phone,
            location: booking.userLocation || (booking.user.latitude && booking.user.longitude
              ? { latitude: booking.user.latitude, longitude: booking.user.longitude }
              : null)
          }
        : null
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch booking" });
  }
});

router.get("/history", async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("provider")
      .lean();

    return res.json({
      bookings: bookings.map((booking) => ({
        bookingId: booking.bookingId,
        serviceType: booking.serviceType,
        status: booking.status,
        etaAt: booking.etaAt,
        etaMinutes: booking.etaMinutes,
        distanceKm: booking.distanceKm,
        price: booking.price,
        isEmergency: booking.isEmergency,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
        providerName: booking.provider ? booking.provider.name : ""
      }))
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load history" });
  }
});

router.post("/booking/:id/cancel", async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id, user: req.user.id }).populate("provider");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!["PENDING", "ACTIVE"].includes(booking.status)) {
      return res.status(400).json({ message: "Booking cannot be cancelled" });
    }

    booking.status = "CANCELLED";
    await booking.save();
    await Provider.findByIdAndUpdate(booking.provider._id, { availability: true });

    if (booking.provider.user) {
      await notify(req, {
        recipient: booking.provider.user,
        bookingId: booking.bookingId,
        type: "BOOKING_CANCELLED",
        title: "Booking cancelled",
        message: `Customer cancelled booking ${booking.bookingId}`
      });
    }

    return res.json({ message: "Booking cancelled" });
  } catch (err) {
    return res.status(500).json({ message: "Cancel failed" });
  }
});

router.post("/booking/:id/rate", async (req, res) => {
  try {
    const { rating, review } = req.body;
    const booking = await Booking.findOne({ bookingId: req.params.id, user: req.user.id });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.rating = rating;
    booking.review = review;
    booking.status = booking.status === "ACTIVE" ? "COMPLETED" : booking.status;
    await booking.save();

    await Provider.findByIdAndUpdate(booking.provider, { availability: true });

    return res.json({ message: "Thanks for the feedback" });
  } catch (err) {
    return res.status(500).json({ message: "Rating failed" });
  }
});

router.get("/booking/:id/messages", async (req, res) => {
  try {
    const booking = await resolveBookingForUser(req.params.id, req.user);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    return res.json({ messages: booking.messages || [] });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load messages" });
  }
});

router.post("/booking/:id/message", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text required" });
    }

    const booking = await Booking.findOne({ bookingId: req.params.id }).populate("provider");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const isCustomer = booking.user.toString() === req.user.id;
    let isProvider = false;

    if (req.user.role === "PROVIDER") {
      const provider = await Provider.findOne({ user: req.user.id });
      if (provider && booking.provider && booking.provider._id.toString() === provider._id.toString()) {
        isProvider = true;
      }
    }

    if (!isCustomer && !isProvider && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findById(req.user.id).lean();
    const senderRole = isProvider ? "PROVIDER" : "CUSTOMER";
    const senderName = user?.name || (isProvider ? "Provider" : "Customer");

    const message = {
      senderRole,
      senderId: req.user.id,
      senderName,
      text: text.trim(),
      sentAt: new Date()
    };

    booking.messages.push(message);
    await booking.save();

    const io = req.app.get("io");
    if (io) {
      io.to(booking.bookingId).emit("message", { ...message, bookingId: booking.bookingId });
    }

    const recipient = isProvider
      ? booking.user
      : booking.provider && booking.provider.user
        ? booking.provider.user
        : null;

    if (recipient) {
      await notify(req, {
        recipient,
        bookingId: booking.bookingId,
        type: "NEW_MESSAGE",
        title: "New message",
        message: `${senderName}: ${text.trim()}`
      });
    }

    return res.json({ messages: booking.messages });
  } catch (err) {
    return res.status(500).json({ message: "Failed to send message" });
  }
});

router.post("/booking/:id/pay", async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id, user: req.user.id }).populate("provider");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.paymentStatus === "PAID") {
      return res.status(400).json({ message: "Payment already completed" });
    }

    const method = req.body.paymentMethod || booking.paymentMethod || "Cash";
    booking.paymentMethod = method;
    booking.paymentStatus = "PAID";
    booking.paymentTxnId = `TXN${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
    booking.paidAt = new Date();
    await booking.save();

    if (booking.provider && booking.provider.user) {
      await notify(req, {
        recipient: booking.provider.user,
        bookingId: booking.bookingId,
        type: "PAYMENT_UPDATE",
        title: "Payment completed",
        message: `Customer completed payment for ${booking.bookingId}`
      });
    }

    return res.json({
      message: "Payment successful (test)",
      paymentStatus: booking.paymentStatus,
      paymentTxnId: booking.paymentTxnId,
      paidAt: booking.paidAt,
      paymentMethod: booking.paymentMethod
    });
  } catch (err) {
    return res.status(500).json({ message: "Payment failed" });
  }
});

router.get("/provider/assignments", async (req, res) => {
  try {
    if (req.user.role !== "PROVIDER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const provider = await Provider.findOne({ user: req.user.id });
    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found" });
    }

    const bookings = await Booking.find({ provider: provider._id })
      .sort({ createdAt: -1 })
      .populate("user")
      .lean();

    return res.json({
      provider: {
        id: provider._id,
        name: provider.name,
        serviceType: provider.serviceType,
        rating: provider.rating,
        availability: provider.availability
      },
      bookings: bookings.map((booking) => ({
        bookingId: booking.bookingId,
        serviceType: booking.serviceType,
        status: booking.status,
        etaAt: booking.etaAt,
        etaMinutes: booking.etaMinutes,
        distanceKm: booking.distanceKm,
        price: booking.price,
        isEmergency: booking.isEmergency,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
        customer: booking.user
          ? { id: booking.user._id, name: booking.user.name, phone: booking.user.phone }
          : null
      }))
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load assignments" });
  }
});

router.post("/provider/availability", async (req, res) => {
  try {
    if (req.user.role !== "PROVIDER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { availability } = req.body;
    const provider = await Provider.findOneAndUpdate(
      { user: req.user.id },
      { availability: Boolean(availability) },
      { new: true }
    );

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found" });
    }

    return res.json({
      provider: {
        id: provider._id,
        availability: provider.availability,
        serviceType: provider.serviceType
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update availability" });
  }
});

router.post("/provider/booking/:id/action", async (req, res) => {
  try {
    if (req.user.role !== "PROVIDER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { action, note, etaMinutes } = req.body;
    const provider = await Provider.findOne({ user: req.user.id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found" });
    }

    const booking = await Booking.findOne({ bookingId: req.params.id, provider: provider._id });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (action === "ACCEPT") {
      booking.status = "ACTIVE";
      if (note && note.trim()) {
        booking.messages.push({
          senderRole: "PROVIDER",
          senderId: req.user.id,
          senderName: provider.name,
          text: note.trim(),
          sentAt: new Date()
        });
      }

      await booking.save();

      await notify(req, {
        recipient: booking.user,
        bookingId: booking.bookingId,
        type: "BOOKING_ACCEPTED",
        title: "Provider accepted booking",
        message: `${provider.name} accepted booking ${booking.bookingId}`
      });

      return res.json({ message: "Booking accepted", booking: toBookingPayload(booking) });
    }

    if (action === "REJECT") {
      booking.status = "REJECTED";
      await booking.save();
      await Provider.findByIdAndUpdate(provider._id, { availability: true });

      await notify(req, {
        recipient: booking.user,
        bookingId: booking.bookingId,
        type: "BOOKING_REJECTED",
        title: "Provider rejected booking",
        message: `${provider.name} rejected booking ${booking.bookingId}`,
        actionType: "REBOOK"
      });

      return res.json({ message: "Booking rejected", booking: toBookingPayload(booking) });
    }

    if (action === "UPDATE") {
      let changed = false;
      if (Number(etaMinutes) > 0) {
        booking.etaMinutes = Number(etaMinutes);
        booking.etaAt = new Date(Date.now() + Number(etaMinutes) * 60 * 1000);
        changed = true;
      }

      if (note && note.trim()) {
        booking.messages.push({
          senderRole: "PROVIDER",
          senderId: req.user.id,
          senderName: provider.name,
          text: note.trim(),
          sentAt: new Date()
        });
        changed = true;
      }

      if (!changed) {
        return res.status(400).json({ message: "Nothing to update" });
      }

      await booking.save();

      await notify(req, {
        recipient: booking.user,
        bookingId: booking.bookingId,
        type: "BOOKING_UPDATED",
        title: "Provider update",
        message: note?.trim() || `ETA updated to ${booking.etaMinutes} minutes`
      });

      const io = req.app.get("io");
      if (io) {
        io.to(booking.bookingId).emit("booking:update", { bookingId: booking.bookingId, booking: toBookingPayload(booking) });
      }

      return res.json({ message: "Booking updated", booking: toBookingPayload(booking) });
    }

    return res.status(400).json({ message: "Invalid action" });
  } catch (err) {
    return res.status(500).json({ message: "Failed provider action" });
  }
});

router.get("/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({ recipient: req.user.id, read: false });

    return res.json({ notifications, unreadCount });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load notifications" });
  }
});

router.post("/notifications/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ message: "Notification marked as read" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update notification" });
  }
});

router.get("/admin/overview", async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const [totalBookings, activeBookings, pendingBookings, completedBookings, totalProviders] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: "ACTIVE" }),
      Booking.countDocuments({ status: "PENDING" }),
      Booking.countDocuments({ status: "COMPLETED" }),
      Provider.countDocuments()
    ]);

    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("user")
      .lean();

    return res.json({
      metrics: {
        totalBookings,
        activeBookings,
        pendingBookings,
        completedBookings,
        totalProviders
      },
      recentBookings: recentBookings.map((booking) => ({
        bookingId: booking.bookingId,
        serviceType: booking.serviceType,
        status: booking.status,
        customerName: booking.user ? booking.user.name : "",
        createdAt: booking.createdAt
      }))
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load admin overview" });
  }
});

export default router;
