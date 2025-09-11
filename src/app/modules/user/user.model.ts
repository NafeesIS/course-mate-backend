import { Schema, model } from "mongoose";
import { IUser } from "./user.interface";

const userSchema = new Schema<IUser>({
  emails: { type: [String], required: true },
  supertokensId: { type: String, required: true, unique: true },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = model<IUser>("User", userSchema);