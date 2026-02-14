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
    // Check if we need to add new providers
    const existingNames = await Provider.distinct("name");
    const newProviders = providerData.filter(p => !existingNames.includes(p.name));
    
    if (newProviders.length > 0) {
      await Provider.insertMany(newProviders);
      console.log(`Added ${newProviders.length} new providers (Total: ${count + newProviders.length})`);
    } else {
      console.log("All providers already exist:", count);
    }
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
