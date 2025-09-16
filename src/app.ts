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
app.get("/", async (req, res) => {
  try {
    // Check if MongoDB is connected
    await mongoose.connect(config.database_url as string);

    // Respond with success message if both API and database are up
    res.status(200).json({
      success: true,
      message: `Course Mate API is running successfully and the database is connected!`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Respond with error if database connection fails
    res.status(500).json({
      success: false,
      message: `API is running, but there is an issue with the database connection`,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
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
