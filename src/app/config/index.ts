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

  // Google OAuth
  google_client_id: process.env.GOOGLE_CLIENT_ID,
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET,

  // Google Drive Upload
  google_drive_client_id: process.env.GOOGLE_DRIVE_CLIENT_ID,
  google_drive_client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  google_drive_refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
  google_drive_folder_id: process.env.GOOGLE_DRIVE_FOLDER_ID,
};