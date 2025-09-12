import { Document, Types } from "mongoose";

export interface ILoginMethod {
  recipeId: string;
  tenantIds: string[];
  timeJoined: number;
  recipeUserId: string;
  verified: boolean;
  email?: string;
  phoneNumber?: string;
  thirdParty?: {
    id: string;
    userId: string;
  };
}

export interface IBillingDetails {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  zipCode: string;
  country: string;
  state: string;
  isDefault: boolean;
  billingType: 'personal' | 'business';
  _id?: Types.ObjectId;
}

export interface IMetaData {
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  _id?: Types.ObjectId;
}

export interface IThirdParty {
  id: string;
  userId: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  uId: string; // SuperTokens user ID
  meta_data: IMetaData;
  timeJoined: number;
  isPrimaryUser: boolean;
  tenantIds: string[];
  emails: string[];
  phoneNumbers: string[];
  thirdParty: IThirdParty[];
  loginMethods: ILoginMethod[];
  emailVerified: boolean;
  profilePicture?: string;
  roles: string[];
  billingDetails: IBillingDetails[];
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}