import express, { Application } from "express";
import cors from "cors";
import path from "path";
import { middleware, errorHandler as supertokensErrorHandler } from "supertokens-node/framework/express";
import * as supertokens from "supertokens-node";
import "./app/config/supertokens";
import router from "./app/routes";
import globalErrorHandler from "./app/middlewares/globalErrorHandlers";
import notFound from "./app/middlewares/notFound";

const app: Application = express();

// CORS configuration
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"], // Add multiple frontend URLs if needed
  allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// SuperTokens middleware
app.use(middleware());

// Routes
app.use('/api/v1', router);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Course Mate API is running successfully!',
    timestamp: new Date().toISOString()
  });
});

// Handle 404 routes
app.use(notFound);

// Error handling
app.use(supertokensErrorHandler());
app.use(globalErrorHandler);

export default app;