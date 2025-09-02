import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { LeadDTO } from './leadGen.interface';
import { LeadServices, createLeadIntoDB } from './leadGen.service';

const createLead: RequestHandler = catchAsync(async (req, res) => {
  const leadData: LeadDTO = req.body;
  const result = await createLeadIntoDB(leadData);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lead created successfully.',
    data: result,
  });
});

const getLeads: RequestHandler = catchAsync(async (req, res) => {
  const result = await LeadServices.getLeadsFromDB();
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Leads fetched successfully.',
    data: result,
  });
});

const getMarketingLeads: RequestHandler = catchAsync(async (req, res) => {
  const result = await LeadServices.getMarketingLeadsFromDB();
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Leads Test fetched successfully.',
    data: result,
  });
});

const getLeadById: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await LeadServices.getLeadByIdFromDB(id);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lead fetched successfully.',
    data: result,
  });
});

const updateLeadById: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updatedFields = req.body;
  const result = await LeadServices.updateLeadsDataIntoDB(id, updatedFields);
  return res.json({
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lead updated successfully.',
    data: result,
  });
});

const createUnsubscribeEmail: RequestHandler = catchAsync(async (req, res) => {
  const { email } = req.query;
  if (typeof email !== 'string' || !email) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid Email');
  }
  const result = await LeadServices.createUnsubscribeEmailIntoDB(email);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result?.message || 'Unsubscribe email created successfully.',
    data: null,
  });
});

export const LeadControllers = {
  createLead,
  getLeads,
  getLeadById,
  updateLeadById,
  getMarketingLeads,
  createUnsubscribeEmail,
};
