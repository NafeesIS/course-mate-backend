import express, { Application } from "express";
import cors from "cors";
import path from "path";
import {
  middleware,
  errorHandler as supertokensErrorHandler,
} from "supertokens-node/framework/express";
import * as supertokens from "supertokens-node";
import "./app/config/supertokens";
import router from "./app/routes";
import globalErrorHandler from "./app/middlewares/globalErrorHandlers";
import notFound from "./app/middlewares/notFound";
import mongoose from "mongoose";
import config from "./app/config";

const app: Application = express();

// CORS configuration

app.use(
  cors({
    origin: [
      "http://localhost:3000", // for local dev
      "https://course-mate-frontend.vercel.app", // your production frontend
    ],
    allowedHeaders: [
      "content-type",
      ...supertokens.getAllCORSHeaders(), // required by SuperTokens
    ],
    credentials: true, // allow cookies/headers for auth
  })
);

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check endpoint
app.get("/", (req, res) => {
  const isConnected = mongoose.connection.readyState === 1; // 1 = connected
  res.status(isConnected ? 200 : 500).json({
    success: isConnected,
    message: isConnected
      ? "API and DB are connected!"
      : "API is up, DB is not connected",
    timestamp: new Date().toISOString(),
  });
});

// Static file serving for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
// SuperTokens middleware
app.use(middleware());
// Routes
app.use("/api/v1", router);
// Handle 404 routes
app.use(notFound);

// Error handling
app.use(supertokensErrorHandler());
app.use(globalErrorHandler);

export default app;
