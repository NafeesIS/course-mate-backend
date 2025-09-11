import { Document } from "mongoose";

export interface IUser extends Document {
  _id: string;
  emails: string[];
  supertokensId: string;
  role: "admin" | "user";
  createdAt: Date;
}