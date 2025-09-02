import axios from 'axios';
import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import config from '../../config';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { FeedbackServices } from './feedback.service';

const createFeedback: RequestHandler = catchAsync(async (req, res) => {
  const { recaptchaToken, ...feedbackData } = req.body;
  if (!recaptchaToken) {
    return res.status(400).json({ success: false, message: 'reCAPTCHA token missing.' });
  }

  // Verify with Google
  const secret = config.recaptcha_secret_key;
  const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

  const params = new URLSearchParams();
  params.append('secret', secret!);
  params.append('response', recaptchaToken);

  const { data: recaptchaRes } = await axios.post(verifyUrl, params);

  // For v3, check score and action
  if (!recaptchaRes.success || recaptchaRes.score < 0.5 || recaptchaRes.action !== 'submit') {
    throw new AppError(httpStatus.BAD_REQUEST, 'reCAPTCHA verification failed.');
  }
  const result = await FeedbackServices.createFeedbackIntoDB(feedbackData);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Feedback submitted successfully.',
    data: result,
  });
});

export const FeedbackControllers = {
  createFeedback,
};
