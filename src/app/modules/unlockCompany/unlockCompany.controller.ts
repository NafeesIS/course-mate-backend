import { RequestHandler, Response } from 'express';
import httpStatus from 'http-status';
import { SessionRequest } from 'supertokens-node/framework/express';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UnlockCompanyServices } from './unlockCompany.service';

const unlockCompanyWithCredit: RequestHandler = catchAsync(
  async (req: SessionRequest, res: Response) => {
    const { _userId, companyId, creditType } = req.body;
    if (!_userId || !companyId || !creditType) {
      throw new AppError(httpStatus.BAD_REQUEST, 'UserId, companyId and creditType are required');
    }
    const sessionUser = req.session!.getUserId();
    // const sessionUser = 'd966b63d-e78d-4204-965d-f85457327fea';
    const result = await UnlockCompanyServices.unlockCompanyWithCredit(
      _userId,
      companyId,
      creditType,
      sessionUser
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Company unlocked successfully',
      data: result,
    });
  }
);

const getUserCreditsAndUnlockedCompany: RequestHandler = catchAsync(
  async (req: SessionRequest, res: Response) => {
    const { _userId } = req.body;
    if (!_userId) {
      throw new AppError(httpStatus.BAD_REQUEST, 'UserId is required');
    }

    const sessionUser = req.session!.getUserId();
    // const sessionUser = 'd966b63d-e78d-4204-965d-f85457327fea';
    const result = await UnlockCompanyServices.getUserUnlockedCompany(_userId, sessionUser);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'User unlocked companies fetched successfully',
      data: result,
    });
  }
);

const getAllUnlockedCompanies: RequestHandler = catchAsync(async (req, res: Response) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'unlockedAt',
    sortOrder = 'desc',
    unlockType = 'all',
    userEmail,
    searchTerm,
    startDate,
    endDate,
    companyType,
  } = req.body;

  // Ensure page and limit are numbers
  const pageNumber = Number(page) || 1; // Default to 1 if NaN
  const limitNumber = Number(limit) || 10; // Default to 10 if NaN

  const result = await UnlockCompanyServices.getAllUnlockedCompanies(
    pageNumber,
    limitNumber,
    sortBy,
    sortOrder,
    unlockType,
    userEmail,
    searchTerm,
    startDate,
    endDate,
    companyType
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'All unlocked companies fetched successfully',
    data: result,
  });
});

export const UnlockCompanyControllers = {
  unlockCompanyWithCredit,
  getUserCreditsAndUnlockedCompany,
  getAllUnlockedCompanies,
};
