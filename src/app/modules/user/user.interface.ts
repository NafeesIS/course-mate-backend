import { Document } from "mongoose";

export interface IUser extends Document {
  _id: string;
  email: string; // Changed from emails array to single email
  supertokensId: string;
  role: "admin" | "user";
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}