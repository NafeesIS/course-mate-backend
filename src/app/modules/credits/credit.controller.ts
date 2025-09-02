import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CreditServices } from './credit.service';

const addBulkUnlockCredit = catchAsync(async (req, res) => {
  const { userId, credits, expiryDays } = req.body;
  if (!userId || !credits || !expiryDays) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }
  // const result = await CreditServices.addBulkUnlockCreditIntoDBWithoutSession(
  //   userId,
  //   credits,
  //   expiryDays
  // );
  const result = 'Api controller not implemented, calling from service function';
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Credits added successfully.',
    data: result,
  });
});

const addBulkUnlockCreditWithoutMongoSession = catchAsync(async (req, res) => {
  const { userId, credits, expiryDays, creditType } = req.body;
  if (!userId || !credits || !expiryDays || !creditType) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }
  const result = await CreditServices.addBulkUnlockCreditIntoDBWithoutSession(
    userId,
    credits,
    expiryDays,
    creditType
  );
  // const result = 'Api controller not implemented, calling from service function';
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Credits added successfully.',
    data: result,
  });
});

export const CreditControllers = {
  addBulkUnlockCredit,
  addBulkUnlockCreditWithoutMongoSession,
};
