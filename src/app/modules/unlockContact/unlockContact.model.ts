import { model, Schema } from 'mongoose';

import { IUnlockedContact } from './unlockContact.interface';

const UnlockedContactSchema = new Schema<IUnlockedContact>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  directorId: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now },
});

UnlockedContactSchema.index({ userId: 1, directorId: 1 }, { unique: true });

export const UnlockedContactModel = model<IUnlockedContact>(
  'Unlocked_Contact',
  UnlockedContactSchema
);
