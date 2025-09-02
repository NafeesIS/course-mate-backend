import { Schema, model } from 'mongoose';
import { TPartner } from './partner.interface';
const partnerSchema = new Schema<TPartner>({
  partnerId: { type: String, required: true },
  userId: {
    $oid: { type: String, required: true },
  },
  status: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: [Number],
  },
  copDetails: {
    profileImg: { type: String, required: true },
    membershipNumber: { type: String, required: true },
    name: { type: String, required: true },
    cpNumber: { type: String, required: true },
    designation: { type: String, required: true },
  },
  firmDetails: {
    firmType: { type: String, required: true },
    firmName: { type: String, required: true },
    numberOfEmployees: { type: String, required: true },
  },
});

export const PartnerModel = model<TPartner>('partner', partnerSchema);
