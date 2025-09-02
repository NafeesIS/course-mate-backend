import { model, Schema } from 'mongoose';

export interface IDistributedLock {
  lockKey: string;
  lockedAt: Date;
  expiresAt: Date;
  instanceId: string;
}

const DistributedLockSchema = new Schema<IDistributedLock>({
  lockKey: { type: String, required: true, unique: true },
  lockedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  instanceId: { type: String, required: true },
});

// Create TTL index to automatically remove expired locks
DistributedLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const DistributedLockModel = model<IDistributedLock>(
  'DistributedLock',
  DistributedLockSchema
);
