import mongoose from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  expiryDate: Date;
  maxRedemptions: number;
  maxRedemptionsPerUser?: number;
  redemptions: number;
  usedBy: mongoose.Types.ObjectId[];
  isActive: boolean;
  minimumOrderValue?: number;
  validServices: mongoose.Types.ObjectId[];
  validUsers?: mongoose.Types.ObjectId[];
  isFirstTimeUser?: boolean;
  // discountRules?: { minQuantity: number; discount: number }[];
  createdBy: mongoose.Types.ObjectId;
  isStackable?: boolean;
}
