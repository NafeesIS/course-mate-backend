// app.ts
import express, { Application, Request, Response } from "express";
import cors from "cors";
import path from "path";
import * as supertokens from "supertokens-node";
import {
  middleware as superTokensMiddleware,
  errorHandler as superTokensErrorHandler,
} from "supertokens-node/framework/express";

import "./app/config/supertokens";
import router from "./app/routes";
import globalErrorHandler from "./app/middlewares/globalErrorHandlers";
import notFound from "./app/middlewares/notFound";
import { connectDB } from "./app/utils/db";

const app: Application = express();

// Connect DB (non-blocking for Vercel cold starts)
connectDB().catch((err) => console.error("DB init failed:", err));

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://course-mate-frontend.vercel.app",
    ],
    allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
    credentials: true,
  })
);

app.use(express.json());

// Health check
app.get("/", (req: Request, res: Response) => {
  res.status(200).send({ success: true, message: "Application is running." });
});

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// SuperTokens
app.use(superTokensMiddleware());

// Routes
app.use("/api/v1", router);

// Error handling
app.use(notFound);
app.use(superTokensErrorHandler());
app.use(globalErrorHandler);

export default app;
