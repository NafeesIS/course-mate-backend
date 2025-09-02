import httpStatus from 'http-status';
import { SessionRequest } from 'supertokens-node/framework/express';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserService } from './user.service';

const getUserInfo = catchAsync(async (req: SessionRequest, res) => {
  const userId = req.session!.getUserId();
  const result = await UserService.getUserInfoFromST(userId);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User Info fetched successfully.',
    data: result,
  });
});

const getUserById = catchAsync(async (req: SessionRequest, res) => {
  const { userId } = req.params;
  const result = await UserService.getUserById(userId);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User fetched successfully.',
    data: result,
  });
});

const updateUserInfo = catchAsync(async (req: SessionRequest, res) => {
  const userId = req.session!.getUserId();
  const result = await UserService.updateUserInfo(userId, req.body);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User Info updated successfully.',
    data: result,
  });
});

const addBillingDetails = catchAsync(async (req: SessionRequest, res) => {
  const userId = req.session!.getUserId();
  const result = await UserService.addBillingDetails(userId, req.body);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Billing details added successfully.',
    data: result,
  });
});

const updateBillingDetails = catchAsync(async (req: SessionRequest, res) => {
  const userId = req.session!.getUserId();
  const { _billingDetailsId, ...updatePayload } = req.body;
  const result = await UserService.updateBillingDetails(userId, _billingDetailsId, updatePayload);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Billing details updated successfully.',
    data: result,
  });
});

const getDefaultBillingDetails = catchAsync(async (req: SessionRequest, res) => {
  const userId = req.session!.getUserId();
  const result = await UserService.getDefaultBillingDetails(userId);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Default billing details fetched successfully.',
    data: result,
  });
});

const deleteBillingDetails = catchAsync(async (req: SessionRequest, res) => {
  const userId = req.session!.getUserId();
  const { _billingDetailsId } = req.params;
  const result = await UserService.deleteBillingDetails(userId, _billingDetailsId);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Billing details deleted successfully.',
    data: result,
  });
});

const searchUserByEmailOrPhone = catchAsync(async (req: SessionRequest, res) => {
  const { email, phone } = req.body;
  if (!email && !phone) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email or phone is required');
  }
  const result = await UserService.searchUserByEmailOrPhone(email, phone);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User fetched successfully.',
    data: result,
  });
});

const getUsersWithPagination = catchAsync(async (req: SessionRequest, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const name = typeof req.query.name === 'string' ? req.query.name : undefined;
  const email = typeof req.query.email === 'string' ? req.query.email : undefined;
  const phone = typeof req.query.phone === 'string' ? req.query.phone : undefined;

  const result = await UserService.getUsersWithPagination(Number(page), Number(limit), {
    name,
    email,
    phone,
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users fetched successfully.',
    data: result,
  });
});

export const UserController = {
  getUserInfo,
  getUserById,
  updateUserInfo,
  addBillingDetails,
  updateBillingDetails,
  getDefaultBillingDetails,
  deleteBillingDetails,
  searchUserByEmailOrPhone,
  getUsersWithPagination,
};
