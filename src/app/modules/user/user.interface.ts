import { Types } from 'mongoose';

export interface IThirdParty {
  id: string;
  userId: string;
}

export interface RecipeUserId {
  getAsString: () => string;
  // recipeUserId: string;
}

export interface ILoginMethod {
  recipeId: 'emailpassword' | 'thirdparty' | 'passwordless';
  tenantIds: string[];
  timeJoined: number;
  recipeUserId: RecipeUserId;
  verified: boolean;
  email?: string;
  phoneNumber?: string;
  thirdParty?: IThirdParty;
}

export interface IBillingDetails {
  _id?: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  address?: string;
  city?: string;
  zipCode: string;
  country: string;
  state: string;
  isDefault: boolean;
  billingType: string;
}

export interface IUser {
  uId: string;
  meta_data: {
    firstName?: string;
    lastName?: string;
    dob?: Date;
    mobileNumber?: string;
    bio?: string;
    avatarUrl?: string;
    social?: {
      linkedin?: string;
      facebook?: string;
      github?: string;
    };
  };
  emailVerified: boolean;
  emails: string[];
  isPrimaryUser: boolean;
  lastLogin?: Date;
  loginMethods: ILoginMethod[];
  phoneNumbers: string[];
  profilePicture?: string;
  roles: string[]; // Add roles field
  tenantIds: string[];
  thirdParty: IThirdParty[];
  timeJoined: number;
  billingDetails: IBillingDetails[];

  subscriptions?: Types.ObjectId[]; // Reference to Subscription
  orders?: Types.ObjectId[]; // Reference to Transaction
  credits?: Types.ObjectId[]; // Reference to Credit
  bulk_unlock_credits?: Types.ObjectId[]; // Reference to BulkUnlockCredit
}
