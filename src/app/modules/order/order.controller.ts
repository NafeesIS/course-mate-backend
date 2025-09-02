import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import { SessionRequest } from 'supertokens-node/framework/express';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { OrderServices } from './order.service';

const createOrder: RequestHandler = catchAsync(async (req, res) => {
  const result = await OrderServices.createOrderIntoDB(req.body);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order created successfully.',
    data: result,
  });
});

const verifyPayment: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const orderId = req.query?.orderId;
  if (!orderId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Order Id is required');
  }

  const sessionUser = req.session!.getUserId();

  const result = await OrderServices.verifyPaymentFromCashFree(orderId as string, sessionUser);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message || 'Order verified successfully.',
    data: result,
  });
});

const verifyPaymentAdminOnly: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const orderId = req.query?.orderId;
  const sessionUser = req.query?.sessionUser;
  if (!orderId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Order Id is required');
  }
  if (!sessionUser) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User uId is required');
  }

  const result = await OrderServices.verifyPaymentFromCashFree(
    orderId as string,
    sessionUser as string
  );
  console.log('result', result);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message || 'Order verified successfully.',
    data: result,
  });
});

const getOrderDetails: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const { orderId } = req.params;

  if (!orderId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Order Id is required');
  }

  const sessionUser = req.session!.getUserId();

  const result = await OrderServices.getOrderDetailsFromDB(sessionUser, orderId as string);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order details retrieved successfully.',
    data: result,
  });
});

const getMultipleOrderDetails: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const { orderIds } = req.body;

  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Order IDs array is required');
  }

  const result = await OrderServices.getMultipleOrderDetailsFromDB(orderIds);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order details retrieved successfully.',
    data: result,
  });
});

const getOrdersWithPagination = catchAsync(async (req: SessionRequest, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const orderId = typeof req.query.orderId === 'string' ? req.query.orderId : undefined;
  const paymentId = typeof req.query.paymentId === 'string' ? req.query.paymentId : undefined;
  const gstNumber = typeof req.query.gstNumber === 'string' ? req.query.gstNumber : undefined;
  const email = typeof req.query.email === 'string' ? req.query.email : undefined;
  const createdAt = typeof req.query.createdAt === 'string' ? req.query.createdAt : undefined;
  const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
  const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
  const sort = req.query.sort === 'desc' ? 'desc' : 'asc'; // Default to ascending

  const result = await OrderServices.getOrdersWithPagination(page, limit, {
    status,
    orderId,
    paymentId,
    gstNumber,
    email,
    createdAt,
    startDate,
    endDate,
    sort,
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Orders fetched successfully.',
    data: result,
  });
});

export const OrderControllers = {
  createOrder,
  verifyPayment,
  verifyPaymentAdminOnly,
  getOrderDetails,
  getMultipleOrderDetails,
  getOrdersWithPagination,
};
