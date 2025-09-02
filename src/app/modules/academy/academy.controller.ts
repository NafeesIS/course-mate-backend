import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AcademyServices } from './academy.service';

const getPromoUser: RequestHandler = catchAsync(async (req, res) => {
  const result = await AcademyServices.getPromoUserIntoDB();
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Promo user fetched successfully.',
    data: result,
  });
});
const createPromoUser: RequestHandler = catchAsync(async (req, res) => {
  const result = await AcademyServices.createPromoUserIntoDB(req.body);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Promo user created successfully.',
    data: result,
  });
});

export const AcademyControllers = {
  createPromoUser,
  getPromoUser,
};
