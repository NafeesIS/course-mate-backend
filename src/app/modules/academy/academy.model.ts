import { Schema, model } from 'mongoose';
import { TPromoUser } from './academy.interface';

const promoUserSchema = new Schema<TPromoUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const PromoUserModel = model<TPromoUser>('PromoUser', promoUserSchema);
