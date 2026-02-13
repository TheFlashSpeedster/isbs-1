import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Provider from "../models/Provider.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, role, serviceType, latitude, longitude } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const safeRole = ["CUSTOMER", "PROVIDER"].includes(role) ? role : "CUSTOMER";
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: safeRole
    });

    if (safeRole === "PROVIDER") {
      const providerService = serviceType || "Misc";
      const providerLocation = {
        latitude: Number(latitude || 28.6139),
        longitude: Number(longitude || 77.209)
      };

      await Provider.create({
        user: user._id,
        name: user.name,
        serviceType: providerService,
        rating: 4.6,
        availability: true,
        location: providerLocation
      });
    }

    return res.status(201).json({
      message: "Registered successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const safeRole = user.role || "CUSTOMER";
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: safeRole },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: safeRole }
    });
  } catch (err) {
    return res.status(500).json({ message: "Login failed" });
  }
});

export default router;
