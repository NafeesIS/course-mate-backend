import { model, Schema } from 'mongoose';
import { FeedbackDocument } from './feedback.interface';

const FeedbackSchema = new Schema<FeedbackDocument>(
  {
    overall: { type: Number, required: true, min: 1, max: 5 },
    website: { type: Number, required: true, min: 1, max: 5 },
    recommend: { type: Number, required: true, min: 1, max: 5 },
    support: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, required: false, trim: true },
    userType: { type: String, enum: ['guest', 'registered'], required: true },
    userEmail: { type: String, required: false },
  },
  { timestamps: true }
);

export const FeedbackModel = model<FeedbackDocument>('feedbacks', FeedbackSchema);
