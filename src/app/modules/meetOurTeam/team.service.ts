import { ITeamMember } from './team.interface';
import { TeamMemberModel } from './team.model';

const createTeamMemberIntoDB = async (teamMemberData: ITeamMember): Promise<ITeamMember> => {
  const existingMember = await TeamMemberModel.findOne({
    email: teamMemberData.email,
  });

  if (existingMember) {
    throw new Error('A team member with the same email already exists.');
  }
  const newTeamMember = new TeamMemberModel(teamMemberData);
  return newTeamMember.save();
};

const getTeamMembersFromDB = async (): Promise<ITeamMember[]> => {
  return await TeamMemberModel.find().sort({ order: 1 });
};

export const MeetOurTeamServices = {
  createTeamMemberIntoDB,
  getTeamMembersFromDB,
};
