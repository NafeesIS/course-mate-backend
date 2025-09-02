import mongoose, { Document, Schema } from 'mongoose';
import { RecentSearchDTO } from './insights.interface';

// Interface representing the RecentSearch document in MongoDB
export interface IRecentSearches extends Document, RecentSearchDTO {}

// Mongoose schema for the RecentSearch document
const recentSearchMongooseSchema: Schema = new Schema(
  {
    type: { type: String, required: true, enum: ['company', 'director'] },
    path: { type: String, required: true },
    idNo: { type: String, required: true },
    name: { type: String, required: true },
    count: { type: Number, default: 1 },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);

// Mongoose model for the RecentSearch collection
const RecentSearches = mongoose.model<IRecentSearches>(
  'recent_searches',
  recentSearchMongooseSchema
);

export default RecentSearches;
