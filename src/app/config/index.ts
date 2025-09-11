/* eslint-disable camelcase */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT || 4000,

  // Database
  database_url: process.env.DATABASE_URL,

  // Supertokens
  supertoken_connection_URI: process.env.SUPERTOKEN_CONNECTION_URI,
  supertoken_api_key: process.env.SUPERTOKEN_API_KEY,
};
