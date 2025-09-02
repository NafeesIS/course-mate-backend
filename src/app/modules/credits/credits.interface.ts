import { Types } from 'mongoose';

export type TCreditType = 'directorUnlock' | 'companyUnlock';

export interface IBulkUnlockCredit {
  userId: Types.ObjectId;
  availableCredits: number;
  expiryDate: Date;
  creditType: TCreditType;
  lastUpdated: Date;
}
