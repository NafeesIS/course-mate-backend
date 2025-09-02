import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { MailchimpServices } from './mailchimp.service';

/**
 * Controller: Ping Mailchimp API to verify connectivity.
 */
const pingHandler: RequestHandler = catchAsync(async (req, res) => {
  const result = await MailchimpServices.ping();
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Mailchimp ping successful.',
    data: result,
  });
});

/**
 * Controller: Add or update a user in the Mailchimp audience.
 */
const addOrUpdateUserToAudienceHandler: RequestHandler = catchAsync(async (req, res) => {
  const { email, firstName, lastName, tags } = req.body;
  if (!email) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email is required');
  }
  await MailchimpServices.addOrUpdateUserToAudience({ email, firstName, lastName, tags });
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User added or updated in Mailchimp audience successfully.',
    data: null,
  });
});

export const MailchimpControllers = {
  pingHandler,
  addOrUpdateUserToAudienceHandler,
};
