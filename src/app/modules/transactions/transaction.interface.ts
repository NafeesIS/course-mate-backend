export type TTransaction = {
  orderId: string;
  paymentId?: string;
  serviceId: string;
  description: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
  name: string;
  email: string;
  phone: string;
  isZohoInvoiceCreated?: boolean;
  invoiceNumber?: string;
  invoiceDate?: Date;
  createdAt: Date;
};

export type TBulkDirectorDataRedeemCoupon = {
  couponCode: string;
  maxRedemptions: number;
  remainingRedemptions: number;
  expiryDate: Date;
  email: string;
  phoneNumber: string;
  redeemedServicesIds: string[];
};
