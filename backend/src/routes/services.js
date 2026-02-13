import express from "express";

const router = express.Router();

const services = [
  { id: "cooking", name: "Cooking", icon: "🍲", startingPrice: 249 },
  { id: "electrician", name: "Electrician", icon: "💡", startingPrice: 399 },
  { id: "plumber", name: "Plumber", icon: "🔧", startingPrice: 349 },
  { id: "misc", name: "Misc", icon: "🧰", startingPrice: 299 }
];

router.get("/services", (req, res) => {
  return res.json({ services });
});

export default router;
