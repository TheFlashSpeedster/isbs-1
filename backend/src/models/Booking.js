import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "Provider", required: true },
    serviceType: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REJECTED", "COMPLETED", "CANCELLED"],
      default: "PENDING"
    },
    etaAt: { type: Date, required: true },
    etaMinutes: { type: Number, required: true },
    distanceKm: { type: Number, required: true },
    price: { type: Number, required: true },
    userLocation: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    isEmergency: { type: Boolean, default: false },
    paymentMethod: { type: String, default: "Cash" },
    paymentStatus: { type: String, enum: ["PENDING", "PAID"], default: "PENDING" },
    paymentTxnId: { type: String },
    paidAt: { type: Date },
    messages: {
      type: [
        {
          senderRole: { type: String, enum: ["CUSTOMER", "PROVIDER"], required: true },
          senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          senderName: { type: String, required: true },
          text: { type: String, required: true },
          sentAt: { type: Date, default: Date.now }
        }
      ],
      default: []
    },
    rating: { type: Number },
    review: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
