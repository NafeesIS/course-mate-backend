import express, { Application } from "express";
import cors from "cors";
import { middleware, errorHandler as supertokensErrorHandler } from "supertokens-node/framework/express";
import * as supertokens from "supertokens-node";  // Add this import
import "./app/config/supertokens";  // Ensure this is configured properly
import router from "./app/routes";
import globalErrorHandler from "./app/middlewares/globalErrorHandlers";

const app: Application = express();

// CORS configuration
app.use(cors({
  origin: "http://localhost:3000",
  allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
  credentials: true,
}));

app.use(express.json());

// Supertokens middleware
app.use(middleware());

// Routes
// in src/app.ts or src/server.ts
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Course Mate backend is running 🚀",
  });
});


// Error handling
app.use(supertokensErrorHandler());
app.use(globalErrorHandler);

export default app;
