import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bookingId: { type: String },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    actionType: { type: String },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
