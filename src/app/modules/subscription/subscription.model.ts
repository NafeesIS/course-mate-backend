import { model, Schema } from 'mongoose';
import { subscriptionPlan, subscriptionStatus } from './subscription.constant';
import { TCompanyAlertReport, TSubscription } from './subscription.interface';

const SubscriptionSchema = new Schema<TSubscription>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, //mongodb user id
  serviceId: { type: Schema.Types.ObjectId, ref: 'ServiceCatalog', required: true }, //mongodb service id
  orderId: { type: String, required: true }, // order id in cashfree
  paymentId: { type: String },
  plan: {
    type: String,
    enum: subscriptionPlan,
    required: true,
  },
  options: { type: [String], default: [] },
  amount: { type: Number, required: true }, // Amount paid for the subscription
  startDate: { type: Date },
  endDate: { type: Date },
  trialEndDate: { type: Date },
  graceEndDate: { type: Date },
  status: {
    type: String,
    enum: subscriptionStatus,
    default: 'active',
  },
  includedStates: { type: [String], default: [] },
});

export const SubscriptionModel = model<TSubscription>('Subscription', SubscriptionSchema);

const CompanyStateWiseDataSchema = new Schema(
  {
    state: { type: String, required: true },
    entityCount: { type: Number, required: true },
    personCount: { type: Number, required: true },
  },
  { _id: false }
);

const EmailHistorySchema = new Schema<TCompanyAlertReport>(
  {
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: String, required: true },
    dataType: { type: String, enum: ['companies', 'llps'], required: true },
    processDate: { type: Date, required: true },
    emailSentDate: { type: Date, required: true },
    blobUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    stateWiseData: { type: [CompanyStateWiseDataSchema], required: true },
    emailStatus: { type: String, required: true },
    planType: { type: String, required: true },
  },
  { timestamps: true, collection: 'email_history' }
);

export const EmailHistoryModel = model<TCompanyAlertReport>('email_history', EmailHistorySchema);
