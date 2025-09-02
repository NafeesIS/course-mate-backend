import { model, Schema } from 'mongoose';
import { ICoupon } from './coupon.interface';

const CouponSchema: Schema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ['percentage', 'flat', 'dynamic'], required: true },
    value: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
    maxRedemptions: { type: Number, required: true },
    maxRedemptionsPerUser: { type: Number, default: 1 },
    redemptions: { type: Number, default: 0 },
    usedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
    minimumOrderValue: { type: Number },
    isFirstTimeUser: { type: Boolean, default: false },
    validServices: [{ type: Schema.Types.ObjectId, ref: 'ServiceCatalog' }],
    validUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isStackable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CouponModel = model<ICoupon>('Coupon', CouponSchema);
