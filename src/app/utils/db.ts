// app/config/db.ts
import mongoose from "mongoose";
import config from "../config";

let isConnected = false; // Global connection state

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  try {
    await mongoose.connect(config.database_url as string, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
    });

    isConnected = true;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err; // Let caller decide what to do
  }
}

// Auto-handling connection issues
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected");
  isConnected = false;
});

mongoose.connection.on("error", (err) => {
  console.error("🚨 MongoDB error:", err);
});
