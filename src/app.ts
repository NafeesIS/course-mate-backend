import express, { Application, Request, Response } from "express";
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

//parsers
app.use(express.json());

// Health check endpoint
const healthCheck = (req: Request, res: Response) => {
  res.status(200).send({
    success: true,
    message: 'Application is up and running.',
  });
};
app.get('/', healthCheck);
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
