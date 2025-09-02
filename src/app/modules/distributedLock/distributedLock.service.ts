/* eslint-disable @typescript-eslint/no-explicit-any */
import { DistributedLockModel } from './distributedLock.model';

export class DistributedLockService {
  private static instance: DistributedLockService;
  private instanceId: string;

  private constructor() {
    // Generate a unique instance ID for this server instance
    this.instanceId = `${process.env.AWS_INSTANCE_ID || 'local'}-${Date.now()}`;
  }

  public static getInstance(): DistributedLockService {
    if (!DistributedLockService.instance) {
      DistributedLockService.instance = new DistributedLockService();
    }
    return DistributedLockService.instance;
  }

  async acquireLock(lockKey: string, ttlSeconds: number = 60): Promise<boolean> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

      // First, try to find an existing lock
      const existingLock = await DistributedLockModel.findOne({ lockKey });

      if (existingLock) {
        // If lock exists and is expired, we can take it
        if (existingLock.expiresAt < now) {
          const result = await DistributedLockModel.findOneAndUpdate(
            { lockKey, expiresAt: { $lt: now } },
            {
              $set: {
                lockedAt: now,
                expiresAt,
                instanceId: this.instanceId,
              },
            },
            { new: true }
          );
          return result !== null && result.instanceId === this.instanceId;
        }
        // If lock exists and is not expired, we can't take it
        return false;
      }

      // If no lock exists, try to create one
      try {
        const newLock = await DistributedLockModel.create({
          lockKey,
          lockedAt: now,
          expiresAt,
          instanceId: this.instanceId,
        });
        return newLock !== null;
      } catch (error: any) {
        // If there's a duplicate key error, it means another instance created the lock
        if (error.code === 11000) {
          return false;
        }
        throw error;
      }
    } catch (error: any) {
      console.error('Error acquiring lock:', error);
      return false;
    }
  }

  async releaseLock(lockKey: string): Promise<void> {
    try {
      await DistributedLockModel.deleteOne({
        lockKey,
        instanceId: this.instanceId,
      });
    } catch (error) {
      console.error('Error releasing lock:', error);
    }
  }

  async isLocked(lockKey: string): Promise<boolean> {
    const lock = await DistributedLockModel.findOne({ lockKey });
    return lock !== null && lock.expiresAt > new Date();
  }
}
