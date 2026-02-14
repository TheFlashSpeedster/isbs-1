import express from "express";

const router = express.Router();

const services = [
  { id: "cooking", name: "Cooking", icon: "🍲", startingPrice: 249 },
  { id: "cleaning", name: "Cleaning", icon: "🧹", startingPrice: 249 },
  { id: "repair", name: "Repair", icon: "🔧", startingPrice: 399 },
  { id: "painting", name: "Painting", icon: "🎨", startingPrice: 349 },
  { id: "shifting", name: "Shifting", icon: "📦", startingPrice: 499 },
  { id: "plumbing", name: "Plumbing", icon: "🚰", startingPrice: 349 },
  { id: "electric", name: "Electric", icon: "💡", startingPrice: 399 }
];

router.get("/services", (req, res) => {
  return res.json({ services });
});

export default router;
