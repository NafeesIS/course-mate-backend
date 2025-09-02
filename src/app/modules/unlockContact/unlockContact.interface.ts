import { Types } from 'mongoose';

export interface IUnlockedContact {
  userId: Types.ObjectId;
  directorId: string;
  unlockedAt: Date;
}
