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

// Static file serving for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// SuperTokens middleware
app.use(middleware());

// Routes
app.use("/api/v1", router);

// Health check endpoint
app.get('/', async (req, res) => {
  try {
    // Ensure MongoDB connection is established before attempting to ping
    if (mongoose.connection.readyState === 1) { // 1 means connected
      await mongoose.connection.db.admin().ping(); // Ping MongoDB
      res.status(200).json({
        success: true,
        message: `Course Mate API is running successfully and the database is connected!${config.database_url}`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: `API is running, but MongoDB is not connected ${config.database_url}`,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    // Respond with error if database connection fails
    res.status(500).json({
      success: false,
      message: 'API is running, but there is an issue with the database connection',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});


// Handle 404 routes
app.use(notFound);

// Error handling
app.use(supertokensErrorHandler());
app.use(globalErrorHandler);

export default app;
