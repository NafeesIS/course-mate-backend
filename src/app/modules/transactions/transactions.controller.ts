import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import { SessionRequest } from 'supertokens-node/framework/express';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { TransactionServices } from './transactions.service';

const createOrder: RequestHandler = catchAsync(async (req, res) => {
  const { amount, currency, description, serviceId } = req.body;

  if (!amount || !currency || !serviceId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }
  const options = {
    amount,
    currency,
    receipt: `txn_${Math.random().toString(36).substring(2, 9)}`,
  };
  const userInfo = {
    description,
    serviceId,
  };
  const result = await TransactionServices.createOrderIntoRazorpay(options, userInfo);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order created successfully.',
    data: result,
  });
});

const verifyTransactionManually: RequestHandler = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  if (!orderId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Order ID is required');
  }

  const result = await TransactionServices.verifyTransactionManually(orderId);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: result.success,
    message: result.message,
    data: result.transaction,
  });
});

// const verifyPayment: RequestHandler = catchAsync(async (req, res) => {
//   const { orderId, paymentId, signature } = req.body;
//   if (!orderId || !paymentId || !signature) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
//   }

//   const result = await TransactionServices.verifyPaymentFromRazorpay(orderId, paymentId, signature);
//   return sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Payment verified successfully.',
//     data: result,
//   });
// });

const createBulkDirectorDataCouponCode = catchAsync(async (req, res) => {
  const { couponCode, maxRedemptions, expiryDate, email, phoneNumber } = req.body;
  // Validate input
  if (!couponCode || !maxRedemptions || !expiryDate || !email || !phoneNumber) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const result = await TransactionServices.createBulkDirectorDataCouponCodeIntoDB({
    couponCode,
    maxRedemptions,
    expiryDate,
    email,
    phoneNumber,
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon code created successfully.',
    data: result,
  });
});

const getTransactionsWithPagination = catchAsync(async (req: SessionRequest, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const orderId = typeof req.query.orderId === 'string' ? req.query.orderId : undefined;
  const paymentId = typeof req.query.paymentId === 'string' ? req.query.paymentId : undefined;
  const email = typeof req.query.email === 'string' ? req.query.email : undefined;
  const name = typeof req.query.name === 'string' ? req.query.name : undefined;
  const phone = typeof req.query.phone === 'string' ? req.query.phone : undefined;
  const createdAt = typeof req.query.createdAt === 'string' ? req.query.createdAt : undefined;
  const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
  const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
  const sort = req.query.sort === 'desc' ? 'desc' : 'asc'; // Default to ascending

  const result = await TransactionServices.getTransactionWithPagination(page, limit, {
    status,
    orderId,
    paymentId,
    email,
    name,
    phone,
    createdAt,
    startDate,
    endDate,
    sort,
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Transactions fetched successfully.',
    data: result,
  });
});

export const TransactionsControllers = {
  createOrder,
  verifyTransactionManually,
  createBulkDirectorDataCouponCode,
  getTransactionsWithPagination,
};
