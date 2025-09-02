import { model, Schema } from 'mongoose';
import { ICampaign } from './campaign.interface';

const CampaignSchema = new Schema<ICampaign>(
  {
    companyCIN: { type: String, required: true, unique: true },
    companyName: { type: String, required: true },
    dateOfIncorporation: { type: Date, required: true },
    directorDIN: { type: String, required: true },
    directorFirstName: { type: String, required: true },
    directorLastName: { type: String, required: true },
    directorEmail: { type: String, required: true },
    campaigns: [
      {
        index: { type: Number, required: true },
        scheduledDate: { type: Date, required: true },
        status: { type: String, enum: ['pending', 'sent'], default: 'pending' },
        sentDate: { type: Date, default: null },
      },
    ],
    funnelStatus: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export const CampaignModel = model<ICampaign>('director_funnel', CampaignSchema, 'director_funnel');
export const TestCampaignModel = model<ICampaign>(
  'test_director_funnel',
  CampaignSchema,
  'test_director_funnel'
);
