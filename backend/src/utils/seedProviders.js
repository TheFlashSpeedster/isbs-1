import mongoose from "mongoose";
import dotenv from "dotenv";
import Provider from "../models/Provider.js";
import { providerData } from "./providerData.js";

dotenv.config();

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("Missing MONGO_URI in environment");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  const count = await Provider.countDocuments();

  if (count === 0) {
    await Provider.insertMany(providerData);
    console.log("Seeded providers:", providerData.length);
  } else {
    console.log("Providers already exist:", count);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
