import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ZohoCrmServices } from './zoho.service';
const scheduleCallIntoZoho: RequestHandler = catchAsync(async (req, res) => {
  const {
    mobile,
    Call_Start_Time, // Message status, e.g., 'SENT'
  } = req.body;
  if (!mobile) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters mobile');
  }
  if (!Call_Start_Time) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters Call_Start_Time');
  }
  const result = await ZohoCrmServices.scheduleCallIntoZohoCRM(mobile, Call_Start_Time);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lead status updated successfully.',
    data: result,
  });
});

const createZohoLead: RequestHandler = catchAsync(async (req, res) => {
  const { data } = req.body;

  const result = await ZohoCrmServices.createZohoLead(data);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result?.message || 'Lead created successfully.',
    data: result.data,
  });
});

const getZohoLeadDetails: RequestHandler = catchAsync(async (req, res) => {
  const mobile = req.query?.mobile as string;
  if (!mobile) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters mobile');
  }
  const result = await ZohoCrmServices.getZohoLeadDetailsFromCRM(mobile);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message || 'Zoho Lead details fetched successfully.',
    data: result.data,
  });
});

const updateLeadInc20Status: RequestHandler = catchAsync(async (req, res) => {
  const { data } = req.body;

  const result = await ZohoCrmServices.updateLeadInc20StatusIntoZoho(data);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message || 'Lead updated successfully.',
    data: result.data,
  });
});

export const ZohoCrmControllers = {
  scheduleCallIntoZoho,
  createZohoLead,
  getZohoLeadDetails,
  updateLeadInc20Status,
};
