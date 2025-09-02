import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import Razorpay from 'razorpay';
import config from '../config';
import {
  BulkDirectorDataRedeemCouponModel,
  TransactionModel,
} from '../modules/transactions/transaction.model';
import sendResponse from '../utils/sendResponse';

const razorpay_key_id =
  config.FSEnvironment === 'development'
    ? (config.razorpay_test_key_id as string)
    : (config.razorpay_key_id as string);
const razorpay_key_secret =
  config.FSEnvironment === 'development'
    ? (config.razorpay_test_key_secret as string)
    : (config.razorpay_key_secret as string);

const razorpayInstance = new Razorpay({
  key_id: razorpay_key_id,
  key_secret: razorpay_key_secret,
});

interface CustomRequest extends Request {
  isPaymentVerified?: boolean;
  verifiedServiceId?: string;
  remainingRedemptions?: number;
  maxRedemptions?: number;
  customerEmail?: string | null;
  customerPhone?: string | null;
  orderId?: string;
  amount?: number;
  currency?: string;
}

export const verifyPaymentMiddleware = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const { orderId, paymentId, signature, serviceId, couponCode, email, phoneNumber } = req.body;

  if (couponCode) {
    try {
      const coupon = await BulkDirectorDataRedeemCouponModel.findOne({
        couponCode,
        email: email?.toLowerCase(),
        phoneNumber,
      });

      if (!coupon) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: 'Coupon code is not valid',
          data: null,
        });
      }
      if (coupon.expiryDate < new Date()) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: 'Coupon code is expired',
          data: null,
        });
      }
      if (coupon.remainingRedemptions <= 0) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: 'Coupon redemption limit reached',
          data: null,
        });
      }

      //check if the service id has already been redeemed
      if (coupon.redeemedServicesIds.includes(serviceId)) {
        req.isPaymentVerified = true;
        req.verifiedServiceId = serviceId;
        req.remainingRedemptions = coupon.remainingRedemptions;
        req.maxRedemptions = coupon.maxRedemptions;
        return next();
      }

      //otherwise use atomic update operation to deduct redeption and add serviceId to the redeemedServicesIds
      const updateResult = await BulkDirectorDataRedeemCouponModel.findOneAndUpdate(
        { couponCode, email, phoneNumber, remainingRedemptions: { $gt: 0 } },
        { $inc: { remainingRedemptions: -1 }, $addToSet: { redeemedServicesIds: serviceId } },
        { new: true }
      );

      if (!updateResult) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: 'Coupon redemption failed',
          data: null,
        });
      }

      req.isPaymentVerified = true;
      req.verifiedServiceId = serviceId;
      req.remainingRedemptions = updateResult.remainingRedemptions;
      req.maxRedemptions = updateResult.maxRedemptions;
      return next(); //skip payment verification
    } catch (error) {
      return next(error);
    }
  }

  if (!orderId || !paymentId || !signature || !serviceId) {
    req.isPaymentVerified = false;
    return next();
  }

  try {
    // Verify the payment signature
    const generatedSignature = crypto
      .createHmac(
        'sha256',
        config.NODE_ENV === 'development'
          ? (config.razorpay_test_key_secret as string)
          : (config.razorpay_key_secret as string)
      )
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (generatedSignature !== signature) {
      req.isPaymentVerified = false;
    } else {
      // Find the transaction and check if it matches the serviceId
      const transaction = await TransactionModel.findOne({ orderId });
      if (transaction && transaction.serviceId === serviceId) {
        // Fetch payment details from Razorpay
        const paymentDetails = await razorpayInstance.payments.fetch(paymentId);

        req.isPaymentVerified = true;
        req.verifiedServiceId = transaction.serviceId;
        req.customerEmail = paymentDetails.email || null;
        req.customerPhone = paymentDetails.contact?.toString() || null;
        req.orderId = transaction.orderId;
        req.amount = transaction.amount / 100;
        req.currency = transaction.currency;

        await TransactionModel.findOneAndUpdate(
          { orderId: orderId },
          {
            $set: {
              status: 'paid',
              paymentId: paymentId,
              email: paymentDetails.email || null,
              phone: paymentDetails.contact || null,
            },
          },
          { new: true }
        );
      } else {
        req.isPaymentVerified = false;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
