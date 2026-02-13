import mongoose from "mongoose";

const providerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    serviceType: { type: String, required: true },
    rating: { type: Number, default: 4.6 },
    availability: { type: Boolean, default: true },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    imageUrl: { type: String, default: "https://placehold.co/120x120" }
  },
  { timestamps: true }
);

export default mongoose.model("Provider", providerSchema);
