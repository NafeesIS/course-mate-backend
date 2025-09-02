import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import { SessionRequest } from 'supertokens-node/framework/express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { SubscriptionServices } from './subscription.service';

const createSubscription: RequestHandler = catchAsync(async (req, res) => {
  // const result = await SubscriptionServices.createSubscriptionIntoDB(req.body);
  const result = 'Api controller not implemented, calling from service function';
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription created successfully.',
    data: result,
  });
});

const getSubscriptionDetails: RequestHandler = catchAsync(async (req, res) => {
  const result = await SubscriptionServices.getSubscriptionDetailsFromDB(req.params);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription details fetched successfully.',
    data: result,
  });
});

const getAllSubscriberEmails: RequestHandler = catchAsync(async (req, res) => {
  const result = await SubscriptionServices.getAllSubscriberEmailsFromDB();
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All subscriber emails fetched successfully.',
    data: result,
  });
});

// ==== admin dashboard routes ====
const getAllSubscriptionDetails: RequestHandler = catchAsync(async (req, res) => {
  const result = await SubscriptionServices.getAllSubscriptionDetailsFromDB(req.query);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All subscription details fetched successfully.',
    data: result,
  });
});

// ==== user dashboard routes ====
const getUserSubscriptionsByIds: RequestHandler = catchAsync(async (req, res) => {
  const { subscriptionIds } = req.body;
  // const subscriptionIds = ['6732deeced1679e78754ae72']; // for testing

  const result = await SubscriptionServices.getSubscriptionsByIdsFromDB(subscriptionIds);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User subscription details fetched successfully.',
    data: result,
  });
});

const getEmailHistoryByUserId: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const {
    userId,
    page,
    limit,
    sortBy,
    sortOrder,
    processDate,
    processEndDate,
    emailSentDate,
    emailSentEndDate,
  } = req.query;
  const sessionUser = req.session!.getUserId();

  // const userId = '6732de4d1b0765277969764e'; // for testing
  // const sessionUser = '15916a13-5ca0-45b6-a6d0-88b70e06c3b5'; // for testing

  const result = await SubscriptionServices.getEmailHistoryByUserIdFromDB(
    {
      userId: userId as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      processDate: processDate as string,
      processEndDate: processEndDate as string,
      emailSentDate: emailSentDate as string,
      emailSentEndDate: emailSentEndDate as string,
    },
    sessionUser as string
  );
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Email history fetched successfully.',
    data: result,
  });
});

const getEmailHistoryForAdmin: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const {
    userId,
    page,
    limit,
    sortBy,
    sortOrder,
    processDate,
    processEndDate,
    emailSentDate,
    emailSentEndDate,
    orderId,
  } = req.query;
  const sessionUser = req.session!.getUserId();

  const result = await SubscriptionServices.getEmailHistoryForAdminFromDB(
    {
      userId: userId as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      processDate: processDate as string,
      processEndDate: processEndDate as string,
      emailSentDate: emailSentDate as string,
      emailSentEndDate: emailSentEndDate as string,
      orderId: orderId as string,
    },
    sessionUser as string
  );
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Email history fetched successfully.',
    data: result,
  });
});

export const SubscriptionControllers = {
  createSubscription,
  getSubscriptionDetails,
  getAllSubscriberEmails,
  getAllSubscriptionDetails,
  getUserSubscriptionsByIds,
  getEmailHistoryByUserId,
  getEmailHistoryForAdmin,
};
