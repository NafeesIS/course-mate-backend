import { Types } from 'mongoose';
export type TSubscriptionPlan = 'monthly' | 'quarterly' | 'annually' | 'trial';
export type TSubscriptionStatus = 'active' | 'inactive' | 'trial' | 'expired' | 'grace';
export type TSubscription = {
  userId: Types.ObjectId; // Reference to User id
  serviceId: Types.ObjectId; // Reference to ServiceCatalog
  orderId: string;
  paymentId?: string;
  plan: TSubscriptionPlan; // 'monthly', 'quarterly', 'annually'
  options?: string[]; // e.g., state selection for "New Company Alert"
  amount: number;
  startDate?: Date;
  endDate?: Date;
  trialEndDate?: Date; // End date for the trial period
  graceEndDate?: Date; // End date for the grace period
  status?: TSubscriptionStatus;
  includedStates?: string[];
};

export type TCompanyStateWiseData = {
  state: string;
  entityCount: number;
  personCount: number;
};

export type TLLPStateWiseData = {
  state: string;
  entityCount: number;
  personCount: number;
};

export type TCompanyAlertReport = {
  _id?: Types.ObjectId;
  subscriptionId: Types.ObjectId;
  userId: Types.ObjectId;
  orderId: string;
  dataType: 'companies' | 'llps';
  processDate: Date;
  emailSentDate: Date;
  blobUrl: string;
  fileName: string;
  fileSize: number;
  stateWiseData: TCompanyStateWiseData[] | TLLPStateWiseData[];
  emailStatus: string;
  planType: 'emailOnly' | 'emailWithPhone';
  createdAt?: Date;
  updatedAt?: Date;
};

export type TEmailHistoryQuery = {
  userId: string; // always string from req.query
  page?: number; // parsed as number in controller
  limit?: number; // parsed as number in controller
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  processDate?: string; // ISO 8601 UTC string (e.g., 2025-07-01T00:00:00.000Z)
  processEndDate?: string; // ISO 8601 UTC string (e.g., 2025-07-05T00:00:00.000Z)
  emailSentDate?: string; // ISO 8601 UTC string (e.g., 2025-07-01T00:00:00.000Z)
  emailSentEndDate?: string; // ISO 8601 UTC string (e.g., 2025-07-05T00:00:00.000Z)
  orderId?: string; // ISO 8601 UTC string (e.g., 2025-07-05T00:00:00.000Z)
};
