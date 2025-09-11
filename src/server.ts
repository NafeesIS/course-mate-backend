import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import config from "./app/config";

let server: Server;

async function main() {
  try {
    // Connect to the database
    await mongoose.connect(config.database_url as string);
    console.log("✅ Connected to the database");

    // Start the application server
    server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
    });
  } catch (err) {
    console.error("❌ Error starting server:", err);
    process.exit(1);
  }
}

main();

// Handle unexpected errors gracefully
process.on("unhandledRejection", (err) => {
  console.error("😈 Unhandled rejection detected. Shutting down...", err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on("uncaughtException", (err) => {
  console.error("😈 Uncaught exception detected. Shutting down...", err);
  process.exit(1);
});
