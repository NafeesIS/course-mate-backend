// import { Server } from "http";
// import mongoose from "mongoose";
// import app from "./app";
// import config from "./app/config";

// let server: Server;

// async function main() {
//   try {
//     await mongoose.connect(config.database_url as string, {
//       serverSelectionTimeoutMS: 30000, // Increase timeout
//       socketTimeoutMS: 45000,
//       family: 4, // Force IPv4
//     });
//     console.log("✅ Connected to the database");

//     server = app.listen(config.port, () => {
//       console.log(`🚀 Course Mate server listening on port ${config.port}`);
//     });
//   } catch (err) {
//     console.error("❌ DB connection error", err);
//     process.exit(1);
//   }
// }

// main();

// // Graceful shutdown
// process.on("unhandledRejection", (err) => {
//   console.error("😈 Unhandled rejection", err);
//   server?.close(() => process.exit(1));
// });

// process.on("uncaughtException", (err) => {
//   console.error("😈 Uncaught exception", err);
//   process.exit(1);
// });
