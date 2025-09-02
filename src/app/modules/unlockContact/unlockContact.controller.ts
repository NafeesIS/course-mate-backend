import { RequestHandler, Response } from 'express';
import httpStatus from 'http-status';
import { SessionRequest } from 'supertokens-node/framework/express';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UnlockContactServices } from './unlockContact.service';

const unlockContactWithCredit: RequestHandler = catchAsync(
  async (req: SessionRequest, res: Response) => {
    const { _userId, directorId, creditType } = req.body;
    if (!_userId || !directorId || !creditType) {
      throw new AppError(httpStatus.BAD_REQUEST, 'UserId, directorId and creditType are required');
    }
    const sessionUser = req.session!.getUserId();
    // const sessionUser = 'd966b63d-e78d-4204-965d-f85457327fea';
    const result = await UnlockContactServices.unlockContactWithCredit(
      _userId,
      directorId,
      creditType,
      sessionUser
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Contact unlocked successfully',
      data: result,
    });
  }
);

const getUserCreditsAndUnlockedContacts: RequestHandler = catchAsync(
  async (req: SessionRequest, res: Response) => {
    const { _userId } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = (req.query.sortBy as string) || 'unlockedAt';
    const order = (req.query.order as string) || 'desc';
    const search = (req.query.search as string) || '';

    if (!_userId) {
      throw new AppError(httpStatus.BAD_REQUEST, 'UserId is required');
    }

    const sessionUser = req.session!.getUserId();
    // const sessionUser = 'd74c825f-4a96-4d0f-9008-e5a5a369d48a';

    const result = await UnlockContactServices.getUserUnlockedContacts(
      _userId as string,
      page,
      limit,
      sessionUser,
      sortBy,
      order,
      search
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'User credits and unlocked contacts fetched successfully',
      data: result,
    });
  }
);

export const UnlockContactControllers = {
  unlockContactWithCredit,
  getUserCreditsAndUnlockedContacts,
};
