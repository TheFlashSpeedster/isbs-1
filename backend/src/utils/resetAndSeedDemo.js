import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Notification from "../models/Notification.js";
import Provider from "../models/Provider.js";
import User from "../models/User.js";

dotenv.config();

function bookingId() {
  return `SRV${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
}

async function createUser({ name, email, phone, password, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return User.create({ name, email: email.toLowerCase(), phone, passwordHash, role });
}

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGO_URI in .env");
  }

  await mongoose.connect(mongoUri);

  await Promise.all([
    Notification.deleteMany({}),
    Booking.deleteMany({}),
    Provider.deleteMany({}),
    User.deleteMany({})
  ]);

  const admin = await createUser({
    name: "Platform Admin",
    email: "admin@instant.in",
    phone: "9000000001",
    password: "Admin@123",
    role: "ADMIN"
  });

  const customer1 = await createUser({
    name: "Ravi Singh",
    email: "ravi.customer@instant.in",
    phone: "9000000002",
    password: "Customer@123",
    role: "CUSTOMER"
  });

  const customer2 = await createUser({
    name: "Priya Sharma",
    email: "priya.customer@instant.in",
    phone: "9000000003",
    password: "Customer@123",
    role: "CUSTOMER"
  });

  const providerUsers = await Promise.all([
    createUser({
      name: "Asha Cooking",
      email: "asha.provider@instant.in",
      phone: "9000000004",
      password: "Provider@123",
      role: "PROVIDER"
    }),
    createUser({
      name: "Imran Electric",
      email: "imran.provider@instant.in",
      phone: "9000000005",
      password: "Provider@123",
      role: "PROVIDER"
    }),
    createUser({
      name: "Karan Plumber",
      email: "karan.provider@instant.in",
      phone: "9000000006",
      password: "Provider@123",
      role: "PROVIDER"
    }),
    createUser({
      name: "Meena Misc",
      email: "meena.provider@instant.in",
      phone: "9000000007",
      password: "Provider@123",
      role: "PROVIDER"
    }),
    createUser({
      name: "Dev Rural Cooking",
      email: "dev.provider@instant.in",
      phone: "9000000008",
      password: "Provider@123",
      role: "PROVIDER"
    })
  ]);

  const providers = await Provider.insertMany([
    {
      user: providerUsers[0]._id,
      name: providerUsers[0].name,
      serviceType: "Cooking",
      rating: 4.8,
      availability: true,
      location: { latitude: 28.6139, longitude: 77.209 },
      imageUrl: "https://placehold.co/120x120?text=AC"
    },
    {
      user: providerUsers[1]._id,
      name: providerUsers[1].name,
      serviceType: "Electrician",
      rating: 4.7,
      availability: true,
      location: { latitude: 28.612, longitude: 77.215 },
      imageUrl: "https://placehold.co/120x120?text=IE"
    },
    {
      user: providerUsers[2]._id,
      name: providerUsers[2].name,
      serviceType: "Plumber",
      rating: 4.6,
      availability: true,
      location: { latitude: 28.619, longitude: 77.205 },
      imageUrl: "https://placehold.co/120x120?text=KP"
    },
    {
      user: providerUsers[3]._id,
      name: providerUsers[3].name,
      serviceType: "Misc",
      rating: 4.6,
      availability: true,
      location: { latitude: 28.607, longitude: 77.211 },
      imageUrl: "https://placehold.co/120x120?text=MM"
    },
    {
      user: providerUsers[4]._id,
      name: providerUsers[4].name,
      serviceType: "Cooking",
      rating: 4.5,
      availability: true,
      location: { latitude: 28.625, longitude: 77.216 },
      imageUrl: "https://placehold.co/120x120?text=DR"
    }
  ]);

  const pendingBooking = await Booking.create({
    bookingId: bookingId(),
    user: customer1._id,
    provider: providers[0]._id,
    serviceType: "Cooking",
    status: "PENDING",
    etaAt: new Date(Date.now() + 15 * 60 * 1000),
    etaMinutes: 15,
    distanceKm: 2.1,
    price: 249,
    isEmergency: false,
    paymentMethod: "UPI",
    paymentStatus: "PENDING",
    messages: []
  });

  await Notification.create({
    recipient: providerUsers[0]._id,
    bookingId: pendingBooking.bookingId,
    type: "BOOKING_ASSIGNED",
    title: "New booking request",
    message: `Booking ${pendingBooking.bookingId} needs your response`,
    actionType: "RESPOND_BOOKING"
  });

  await Notification.create({
    recipient: customer1._id,
    bookingId: pendingBooking.bookingId,
    type: "BOOKING_CREATED",
    title: "Booking created",
    message: `Booking ${pendingBooking.bookingId} is waiting for provider acceptance`
  });

  console.log("Demo reset complete.");
  console.log("Credentials:");
  console.log("ADMIN    | admin@instant.in            | Admin@123");
  console.log("CUSTOMER | ravi.customer@instant.in    | Customer@123");
  console.log("CUSTOMER | priya.customer@instant.in   | Customer@123");
  console.log("PROVIDER | asha.provider@instant.in    | Provider@123");
  console.log("PROVIDER | imran.provider@instant.in   | Provider@123");
  console.log("PROVIDER | karan.provider@instant.in   | Provider@123");
  console.log("PROVIDER | meena.provider@instant.in   | Provider@123");
  console.log("PROVIDER | dev.provider@instant.in     | Provider@123");

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err.message);
  await mongoose.disconnect();
  process.exit(1);
});
