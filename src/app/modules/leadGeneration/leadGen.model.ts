import mongoose, { Document, Schema } from 'mongoose';
import { serviceType } from './leadGen.constant';
import { IUnsubscribe, LeadDTO } from './leadGen.interface';

// Interface representing the Lead document in MongoDB
export interface ILeads extends Document, LeadDTO {}

// Mongoose schema for the Lead document
// const leadMongooseSchema: Schema = new Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     contactNo: { type: String, required: true },
//     serviceType: { type: [String], required: true },
//     otherService: { type: String, default: '' }, // Optional field
//     sources: { type: [String], default: [] }, // Array to store multiple sources
//     pathname: { type: String, required: true },
//     isContacted: { type: Boolean, default: false },
//     leadConverted: { type: Boolean, default: false },
//   },
//   {
//     timestamps: true, // Automatically manage createdAt and updatedAt fields
//   }
// );

const leadMongooseSchema: Schema = new Schema<LeadDTO>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contactNo: { type: String, required: true },
    serviceType: { type: [String], enum: serviceType, required: true },
    otherService: { type: String, default: '' },
    isQualified: { type: Boolean, default: null },
    sources: { type: [String], default: [] },
    pathname: { type: String, required: true },
    isContacted: { type: Boolean, default: null },
    leadConverted: { type: Boolean, default: null },
    convertingRemarkReason: { type: String, default: '' },
    contactingFailedReason: { type: String, default: '' },
    nextCallSchedule: { type: Date, default: null },
    customerReqCallSchedule: { type: Date, default: null },
    followUpTime: { type: String, default: '' },
    customerReqFollowUpTime: { type: String, default: '' },
    hitsCount: { type: Number, default: 1 },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);

const UnsubscribeSchema = new Schema<IUnsubscribe>({
  email: { type: String, required: true, unique: true },
  unsubscribedAt: { type: Date, default: Date.now },
});

// Mongoose model for the Lead collection
const Leads = mongoose.model<ILeads>('Leads', leadMongooseSchema);
export const UnsubscribeModel = mongoose.model<IUnsubscribe>('Unsubscribe', UnsubscribeSchema);

export default Leads;
