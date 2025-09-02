import { model, Schema } from 'mongoose';
import { IBillingDetails, ILoginMethod, IThirdParty, IUser } from './user.interface';

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
    tenantIds: { type: [String], required: true },
    timeJoined: { type: Number, required: true },
    recipeUserId: { type: String, required: true },
    verified: { type: Boolean, required: true },
    email: { type: String },
    phoneNumber: { type: String },
    thirdParty: thirdPartySchema,
  },
  { _id: false }
);

const billingDetailsSchema = new Schema<IBillingDetails>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  state: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  billingType: { type: String, required: true },
});

const userSchema = new Schema<IUser>({
  uId: { type: String, required: true, unique: true },
  meta_data: {
    type: {
      firstName: { type: String },
      lastName: { type: String },
      dob: { type: Date },
      mobileNumber: { type: String },
      bio: { type: String },
      avatarUrl: { type: String },
      social: { linkedin: { type: String }, facebook: { type: String }, github: { type: String } },
    },
    default: {},
  },
  emailVerified: { type: Boolean, required: true },
  emails: { type: [String], required: true },
  isPrimaryUser: { type: Boolean, required: true },
  lastLogin: { type: Date },
  loginMethods: { type: [loginMethodSchema], required: true },
  phoneNumbers: { type: [String], required: true },
  profilePicture: { type: String },
  roles: { type: [String], required: true }, // Add roles field
  tenantIds: { type: [String], required: true },
  thirdParty: { type: [thirdPartySchema], required: true },
  timeJoined: { type: Number, required: true },
  billingDetails: { type: [billingDetailsSchema] },
  subscriptions: [{ type: Schema.Types.ObjectId, ref: 'Subscription' }],
  orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
  credits: [{ type: Schema.Types.ObjectId, ref: 'Credit' }],
  bulk_unlock_credits: [{ type: Schema.Types.ObjectId, ref: 'BulkUnlockCredit', default: [] }],
});

export const UserModel = model<IUser>('User', userSchema);
// export const UserModel = model<IUser>('userTests', userSchema, 'userTests');
