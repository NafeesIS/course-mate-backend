import { Document } from "mongoose";

export interface IUser extends Document {
  _id: string;
  email: string;
  supertokensId: string;
  role: "admin" | "user";
  createdAt: Date;
}