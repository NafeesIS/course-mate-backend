import { Schema, model } from "mongoose";
import { IUser } from "./user.interface";

const userSchema = new Schema<IUser>({
  email: { type: String, required: true }, // Single email field
  supertokensId: { type: String, required: true, unique: true },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  firstName: { type: String },
  lastName: { type: String },
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Create index for faster queries
userSchema.index({ supertokensId: 1 });
userSchema.index({ email: 1 });

export const UserModel = model<IUser>("User", userSchema);