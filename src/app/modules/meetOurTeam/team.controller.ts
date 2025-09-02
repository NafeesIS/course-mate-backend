import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { MeetOurTeamServices } from './team.service';

const createTeamMember: RequestHandler = catchAsync(async (req, res) => {
  const result = await MeetOurTeamServices.createTeamMemberIntoDB(req.body);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Team member created successfully.',
    data: result,
  });
});

const getTeamMembers: RequestHandler = catchAsync(async (req, res) => {
  const result = await MeetOurTeamServices.getTeamMembersFromDB();
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Team members data fetched successfully.',
    data: result,
  });
});

export const TeamMemberControllers = {
  createTeamMember,
  getTeamMembers,
};
