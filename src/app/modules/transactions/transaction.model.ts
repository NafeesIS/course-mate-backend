/* eslint-disable camelcase */
import { Schema, model } from 'mongoose';
import { TBulkDirectorDataRedeemCoupon, TTransaction } from './transaction.interface';
const transactionSchema = new Schema<TTransaction>(
  {
    orderId: { type: String, required: true },
    paymentId: { type: String },
    name: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String },
    serviceId: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    receipt: { type: String, required: true },
    status: { type: String, required: true },
    isZohoInvoiceCreated: { type: Boolean, default: false },
    invoiceNumber: { type: String },
    invoiceDate: { type: Date },
    created_at: { type: Number, required: true },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);

const bulkDirectorDataRedeemCouponSchema = new Schema<TBulkDirectorDataRedeemCoupon>({
  couponCode: { type: String, required: true, unique: true },
  maxRedemptions: { type: Number, required: true },
  remainingRedemptions: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  redeemedServicesIds: { type: [String] },
});

export const TransactionModel = model<TTransaction>(
  'transactions',
  transactionSchema,
  'transactions'
);

export const BulkDirectorDataRedeemCouponModel = model<TBulkDirectorDataRedeemCoupon>(
  'Bulk_Director_Data_Redeem_Coupon',
  bulkDirectorDataRedeemCouponSchema
);
