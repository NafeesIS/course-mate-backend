/* eslint-disable camelcase */

import { model, Schema } from 'mongoose';
import { IZohoAuthToke } from './zoho.interface';

const ZohoAuthTokenSchema = new Schema<IZohoAuthToke>({
  access_token: String,
  scope: String,
  api_domain: String,
  token_type: String,
  expires_in: Number,
  cookie: String,
  savedAt: { type: Date, default: Date.now },
});

// Define a schema for storing lead assignment data for round robin strategy
const leadAssignmentSchema = new Schema({
  cin: { type: String, required: true, unique: true },
  ownerIndex: { type: Number, required: true },
  lastAssigned: { type: Date, default: Date.now },
});

// Define a schema for storing the current owner index
const leadOwnerIndexSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, required: true },
});

export const ZohoAuthToken = model('ZohoAuthToken', ZohoAuthTokenSchema);
export const ZohoLeadAssignment = model('ZohoLeadAssignment', leadAssignmentSchema);

export const ZohoLeadOwnerIndex = model('ZohoLeadOwnerIndex', leadOwnerIndexSchema);
