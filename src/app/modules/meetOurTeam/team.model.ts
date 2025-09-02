import mongoose, { Schema } from 'mongoose';
import { ITeamMember } from './team.interface';

const teamMemberMongooseSchema: Schema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    designation: { type: String, required: true },
    photoUrl: { type: String, required: true },
    githubUrl: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    order: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

export const TeamMemberModel = mongoose.model<ITeamMember>(
  'our_team',
  teamMemberMongooseSchema,
  'our_team'
);
