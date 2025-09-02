import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { WebhooksServices } from './webhooks.service';

/**
 * MSG91 WhatsApp Webhook Controller
 * Handles incoming webhooks from MSG91 for WhatsApp message delivery status
 */
const msg91WhatsappWebhook: RequestHandler = catchAsync(async (req, res) => {
  // Validate request body exists
  if (!req.body || Object.keys(req.body).length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Empty webhook payload received',
      data: null,
    });
  }

  // Process the webhook
  const result = await WebhooksServices.msg91WhatsappWebhook(req.body);

  // Return appropriate response
  if (result.success) {
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: result.data,
    });
  } else {
    // Log error but still return 200 to MSG91
    console.error('Webhook processing failed:', result.error);
    return sendResponse(res, {
      statusCode: httpStatus.OK, // Return 200 even on error to prevent MSG91 retries
      success: false,
      message: result.message,
      data: { error: result.error },
    });
  }
});

export const WebhooksControllers = {
  msg91WhatsappWebhook,
};
