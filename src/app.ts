import express, { Application } from "express";
import cors from "cors";
import { middleware, errorHandler as supertokensErrorHandler } from "supertokens-node/framework/express";
import "../src/app/config/supertokens.ts";
import router from "./app/routes";
import globalErrorHandler from "./app/middlewares/globalErrorHandlers";

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json()); // replaces body-parser

// Supertokens middleware
app.use(middleware());

// Routes
app.use("/", router);

// Error handling
app.use(supertokensErrorHandler());
//global error handler
app.use(globalErrorHandler);

export default app;
