import { Schema, model } from 'mongoose';

export interface IApiKey {
  key: string;
  name: string;
  email: string;
  company: string;
  isActive: boolean;
  createdAt: Date;
  lastUsed: Date;
  usageCount: number;
  rateLimit: number; // requests per minute
}

const apiKeySchema = new Schema<IApiKey>(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    company: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    lastUsed: { type: Date, default: Date.now },
    usageCount: { type: Number, default: 0 },
    rateLimit: { type: Number, default: 60 }, // Default 60 requests per minute
  },
  {
    timestamps: true,
  }
);

export const ApiKeyModel = model<IApiKey>('ApiKey', apiKeySchema);
