import { Schema, model } from "mongoose";
import { IUser, ILoginMethod, IMetaData, IThirdParty } from "./user.interface";

const metaDataSchema = new Schema<IMetaData>(
  {
    firstName: { type: String },
    lastName: { type: String },
    mobileNumber: { type: String },
  },
  { _id: true }
);

const thirdPartySchema = new Schema<IThirdParty>(
  {
    id: { type: String, required: true },
    userId: { type: String, required: true },
  },
  { _id: false }
);

const loginMethodSchema = new Schema<ILoginMethod>(
  {
    recipeId: { type: String, required: true },
    tenantIds: [{ type: String }],
    timeJoined: { type: Number, required: true },
    recipeUserId: { type: String, required: true },
    verified: { type: Boolean, required: true },
    email: { type: String },
    phoneNumber: { type: String },
    thirdParty: thirdPartySchema,
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    uId: { type: String, required: true, unique: true },
    meta_data: { type: metaDataSchema, default: {} },
    timeJoined: { type: Number, required: true },
    isPrimaryUser: { type: Boolean, required: true },
    tenantIds: [{ type: String }],
    emails: [{ type: String }],
    phoneNumbers: [{ type: String }],
    thirdParty: [thirdPartySchema],
    loginMethods: [loginMethodSchema],
    emailVerified: { type: Boolean, default: false },
    profilePicture: { type: String },
    roles: [{ type: String }],
    lastLogin: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
// userSchema.index({ uId: 1 });
// userSchema.index({ "emails": 1 });
userSchema.index({ roles: 1 });

export const UserModel = model<IUser>("users", userSchema, "users");
