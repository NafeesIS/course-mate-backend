// src/server.ts

import express, { Application, Request, Response } from "express";
import cors from "cors";
import path from "path";
import { Server } from "http";
import mongoose from "mongoose";
import * as supertokens from "supertokens-node";
import {
  middleware,
  errorHandler as supertokensErrorHandler,
} from "supertokens-node/framework/express";

import config from "./app/config";
import "./app/config/supertokens"; // SuperTokens initialization
import router from "./app/routes";
import globalErrorHandler from "./app/middlewares/globalErrorHandlers";
import notFound from "./app/middlewares/notFound";

const app: Application = express();
let server: Server;

/**
 * -----------------------------
 * Middleware
 * -----------------------------
 */

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000", // Local dev
      "https://course-mate-frontend.vercel.app", // Production frontend
    ],
    allowedHeaders: [
      "content-type",
      ...supertokens.getAllCORSHeaders(), // Required by SuperTokens
    ],
    credentials: true,
  })
);

// Parsers
app.use(express.json());

/**
 * -----------------------------
 * Health Check
 * -----------------------------
 */
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "✅ Application is up and running",
  });
});

/**
 * -----------------------------
 * Static Files
 * -----------------------------
 */
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/**
 * -----------------------------
 * SuperTokens
 * -----------------------------
 */
app.use(middleware());

/**
 * -----------------------------
 * Routes
 * -----------------------------
 */
app.use("/api/v1", router);

/**
 * -----------------------------
 * Error Handling
 * -----------------------------
 */
app.use(notFound);
app.use(supertokensErrorHandler());
app.use(globalErrorHandler);

/**
 * -----------------------------
 * Database & Server Init
 * -----------------------------
 */
async function startServer() {
  try {
    await mongoose.connect(config.database_url as string, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
    });

    console.log("✅ Connected to MongoDB");

    server = app.listen(config.port, () => {
      console.log(`🚀 Course Mate server running on port ${config.port}`);
    });
  } catch (err) {
    console.error("❌ DB connection error", err);
    process.exit(1);
  }
}

startServer();

/**
 * -----------------------------
 * Graceful Shutdown
 * -----------------------------
 */
process.on("unhandledRejection", (err) => {
  console.error("😈 Unhandled rejection", err);
  if (server) server.close(() => process.exit(1));
  else process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("😈 Uncaught exception", err);
  process.exit(1);
});

export default app;
