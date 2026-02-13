import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" },
    line1: String,
    line2: String,
    city: String,
    state: String,
    zip: String,
    latitude: Number,
    longitude: Number
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["CUSTOMER", "PROVIDER", "ADMIN"],
      default: "CUSTOMER"
    },
    addresses: { type: [addressSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
