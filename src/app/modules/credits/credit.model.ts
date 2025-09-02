import { model, Schema } from 'mongoose';
import { creditType } from './credit.constant';
import { IBulkUnlockCredit } from './credits.interface';

const BulkUnlockCreditSchema = new Schema<IBulkUnlockCredit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    availableCredits: { type: Number, required: true, default: 0 },
    expiryDate: { type: Date, required: true },
    creditType: { type: String, enum: creditType, required: true },
  },
  {
    timestamps: true,
  }
);

BulkUnlockCreditSchema.index({ userId: 1, creditType: 1 }, { unique: true });

export const BulkUnlockCreditModel = model<IBulkUnlockCredit>(
  'BulkUnlockCredit',
  BulkUnlockCreditSchema
);
