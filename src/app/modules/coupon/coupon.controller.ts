import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CouponServices } from './coupon.service';

const createCoupon: RequestHandler = catchAsync(async (req, res) => {
  const result = await CouponServices.createCouponIntoDB(req.body);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon created successfully.',
    data: result,
  });
});

const verifyCoupon: RequestHandler = catchAsync(async (req, res) => {
  const result = await CouponServices.verifyCouponFromDB(req.body);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon verified successfully.',
    data: result,
  });
});

const getAllCoupons: RequestHandler = catchAsync(async (req, res) => {
  const result = await CouponServices.getAllCouponsFromDB();
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupons fetched successfully.',
    data: result,
  });
});

// delete a coupon
const deleteCoupon: RequestHandler = catchAsync(async (req, res) => {
  const { code } = req.params;
  if (!code) {
    throw new Error('Coupon code is required');
  }

  const result = await CouponServices.deleteCouponFromDB(code);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon deleted successfully',
    data: result,
  });
});

// update a coupon
const updateCoupon: RequestHandler = catchAsync(async (req, res) => {
  const { code } = req.params;
  const updateData = req.body;
  if (!code) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Coupon code is required');
  }

  const allowedFields = [
    'expiryDate',
    'maxRedemptions',
    'maxRedemptionsPerUser',
    'isActive',
    'minimumOrderValue',
    'isFirstTimeUser',
    'validServices',
    'validUsers',
    'isStackable',
  ] as const;
  const invalidFields = Object.keys(updateData).filter(
    key => !allowedFields.includes(key as (typeof allowedFields)[number])
  );
  if (invalidFields.length) {
    throw new AppError(httpStatus.BAD_REQUEST, `Invalid fields: ${invalidFields.join(', ')}`);
  }

  const result = await CouponServices.updateCouponByCode(code, updateData);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon updated successfully',
    data: result,
  });
});

export const CouponControllers = {
  createCoupon,
  verifyCoupon,
  getAllCoupons,
  deleteCoupon,
  updateCoupon,
};
