/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { isValid, parse } from 'date-fns';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import config from '../../config';
import AppError from '../../errors/AppError';
import { toTitleCase } from '../../utils/dataFormatter';
import {
  sendEmailWithAzure,
  sendUnlockContactDetailsSMS,
} from '../../utils/notification/notification';
import directorContactDetailsEmail from '../../utils/notification/templates/directorContactDetailsEmail';
import { DirectorModel } from '../director/director.model';
import { BulkDirectorDataRedeemCouponModel, TransactionModel } from './transaction.model';

const key_id =
  config.FSEnvironment === 'development'
    ? (config.razorpay_test_key_id as string)
    : (config.razorpay_key_id as string);
const key_secret =
  config.FSEnvironment === 'development'
    ? (config.razorpay_test_key_secret as string)
    : (config.razorpay_key_secret as string);

// const key_id =
//   config.FSEnvironment === 'development'
//     ? (config.razorpay_key_id as string)
//     : (config.razorpay_test_key_id as string);

// const key_secret =
//   config.FSEnvironment === 'development'
//     ? (config.razorpay_key_secret as string)
//     : (config.razorpay_test_key_secret as string);

const razorpayInstance = new Razorpay({
  key_id: key_id,
  key_secret: key_secret,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createOrderIntoRazorpay = async (options: any, userInfo: any) => {
  const order = await razorpayInstance.orders.create(options);
  // Upsert transaction details to the database
  await TransactionModel.findOneAndUpdate(
    { orderId: order.id }, // Filter
    {
      $set: {
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        serviceId: userInfo.serviceId,
        status: 'created',
        description: userInfo.description,
        created_at: order.created_at,
      },
    },
    { upsert: true, new: true } // Upsert and return the new document
  );
  return order;
};

interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  email: string;
  contact: string;
  notes: Record<string, unknown>;
  created_at: number;
}

interface RazorpayPaymentsResponse {
  entity: string;
  count: number;
  items: RazorpayPayment[];
}

const verifyTransactionManually = async (orderId: string) => {
  // Find the transaction
  const transaction = await TransactionModel.findOne({ orderId });
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Transaction not found');
  }

  // Check payment status with Razorpay
  const payments = (await razorpayInstance.orders.fetchPayments(
    orderId
  )) as RazorpayPaymentsResponse;

  if (payments.count === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No payments made for this order');
  }

  // Get the latest payment
  const latestPayment = payments.items[0];

  // If payment is captured, update transaction and send director details
  if (latestPayment.status === 'captured') {
    // Update transaction status
    const updatedTransaction = await TransactionModel.findOneAndUpdate(
      { orderId },
      {
        $set: {
          status: 'paid',
          paymentId: latestPayment.id,
          email: latestPayment.email || null,
          phone: latestPayment.contact || null,
        },
      },
      { new: true }
    );

    if (!updatedTransaction) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update transaction status');
    }

    // Get director details
    const director = await DirectorModel.findOne(
      { din: transaction.serviceId },
      { mobileNumber: 1, emailAddress: 1, fullName: 1, din: 1 }
    );

    if (!director) {
      throw new AppError(httpStatus.NOT_FOUND, 'Director not found');
    }

    // Send SMS with director's contact details
    if (updatedTransaction.phone) {
      // TODO: Implement SMS sending logic

      console.log(`Sending SMS to customer ${updatedTransaction.phone}`);
      await sendUnlockContactDetailsSMS(
        updatedTransaction.phone,
        director.din,
        toTitleCase(director.fullName),
        director.mobileNumber,
        director.emailAddress
      );
    }

    // Send email with director's contact details
    if (updatedTransaction.email && updatedTransaction.email !== 'void@razorpay.com') {
      const emailContent = directorContactDetailsEmail({
        directorName: director.fullName,
        directorMobile: director.mobileNumber,
        directorEmail: director.emailAddress,
        din: director.din,
        orderId: transaction.orderId,
        amount: transaction.amount / 100,
        currency: transaction.currency,
      });

      //add a cc email to send with azure
      const ccEmail = ['nazrul@filesure.in', 'tushar@filesure.in'];
      await sendEmailWithAzure(
        updatedTransaction.email,
        'Director Contact Details - Filesure',
        emailContent,
        ccEmail
      );
    }

    return {
      success: true,
      message: 'Payment verified and notifications sent successfully',
      transaction: updatedTransaction,
    };
  } else {
    return {
      success: false,
      message: 'Payment not captured yet',
      transaction,
    };
  }
};

const createBulkDirectorDataCouponCodeIntoDB = async (couponData: Record<string, unknown>) => {
  const { couponCode, maxRedemptions, expiryDate, email, phoneNumber } = couponData;
  // Parse the expiry date from dd-MMM-yyyy format to a Date object
  const parsedExpiryDate = parse(expiryDate as string, 'dd-MMM-yyyy', new Date());

  // Validate the parsed date
  if (isNaN(parsedExpiryDate.getTime())) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid expiry date format. Use dd-MMM-yyyy.');
  }

  // Check if the coupon code already exists
  const existingCoupon = await BulkDirectorDataRedeemCouponModel.findOne({ couponCode });
  if (existingCoupon) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Coupon code already exists.');
  }

  const coupon = await BulkDirectorDataRedeemCouponModel.findOneAndUpdate(
    { couponCode },
    {
      $set: {
        maxRedemptions,
        remainingRedemptions: maxRedemptions,
        expiryDate: parsedExpiryDate,
        email,
        phoneNumber,
      },
    },
    { upsert: true, new: true } // Upsert and return the new document
  );

  return coupon;
};

const getTransactionWithPagination = async (
  page: number,
  limit: number,
  searchQuery: {
    status?: string;
    orderId?: string;
    paymentId?: string;
    email?: string;
    name?: string;
    phone?: string;
    createdAt?: string; // Single date
    startDate?: string; // Start of range
    endDate?: string; // End of range
    sort?: 'asc' | 'desc';
  }
) => {
  const query: {
    $or?: Array<{ [key: string]: string | RegExp | { $in: mongoose.Types.ObjectId[] } }>;
    createdAt?: any;
    status?: any;
  } = {};

  if (searchQuery.status) {
    query.status = searchQuery.status;
  }

  if (searchQuery.orderId) {
    query['$or'] = [...(query['$or'] || []), { orderId: searchQuery.orderId }];
  }

  if (searchQuery.paymentId) {
    query['$or'] = [...(query['$or'] || []), { paymentId: searchQuery.paymentId }];
  }

  if (searchQuery.email) {
    query['$or'] = [...(query['$or'] || []), { email: searchQuery.email }];
  }

  if (searchQuery.phone) {
    query['$or'] = [...(query['$or'] || []), { phone: searchQuery.phone }];
  }

  const dateQuery: any = {};
  if (searchQuery.startDate && searchQuery.endDate) {
    // Parse the dates in dd-MM-yyyy format
    const [startDay, startMonth, startYear] = searchQuery.startDate.split('-');
    const [endDay, endMonth, endYear] = searchQuery.endDate.split('-');
    // Create start date at 00:00:00 IST (previous day 18:30:00 UTC)
    const startDateUTC = new Date(
      Date.UTC(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay), 18, 30, 0, 0)
    );
    startDateUTC.setUTCDate(startDateUTC.getUTCDate() - 1); // Move to previous day
    // Create end date at 23:59:59 IST (same day 18:29:59 UTC)
    const endDateUTC = new Date(
      Date.UTC(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay), 18, 29, 59, 999)
    );

    if (isValid(startDateUTC) && isValid(endDateUTC)) {
      query['createdAt'] = dateQuery['createdAt'] = {
        $gte: startDateUTC,
        $lte: endDateUTC,
      };
    }
  }

  const sortOption = searchQuery.sort === 'desc' ? -1 : 1;

  const transactions = await TransactionModel.find(query)
    .select('orderId amount email status paymentId currency name phone receipt serviceId createdAt')
    .sort({ createdAt: sortOption })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalTransactions = await TransactionModel.countDocuments();
  const totalTransactionsForPages = await TransactionModel.countDocuments(query);

  const statusAggregationPipeline: any[] = [];
  const statisticsMatchQuery: any = {};
  if (searchQuery.orderId) {
    statisticsMatchQuery['$or'] = [
      ...(statisticsMatchQuery['$or'] || []),
      { orderId: searchQuery.orderId },
    ];
  }

  if (searchQuery.paymentId) {
    statisticsMatchQuery['$or'] = [
      ...(statisticsMatchQuery['$or'] || []),
      { paymentId: searchQuery.paymentId },
    ];
  }

  if (searchQuery.email) {
    statisticsMatchQuery['$or'] = [
      ...(statisticsMatchQuery['$or'] || []),
      { email: searchQuery.email },
    ];
  }

  if (searchQuery.phone) {
    statisticsMatchQuery['$or'] = [
      ...(statisticsMatchQuery['$or'] || []),
      { phone: searchQuery.phone },
    ];
  }

  if (Object.keys(statisticsMatchQuery).length > 0) {
    statusAggregationPipeline.push({ $match: statisticsMatchQuery });
  }

  if (Object.keys(dateQuery).length > 0) {
    statusAggregationPipeline.push({ $match: dateQuery });
  }

  statusAggregationPipeline.push({
    $group: {
      _id: '$status',
      count: { $sum: 1 },
      totalInrAmount: {
        $sum: {
          $cond: [{ $eq: ['$currency', 'INR'] }, { $add: ['$amount'] }, 0],
        },
      },
      totalUsdAmount: {
        $sum: {
          $cond: [{ $eq: ['$currency', 'USD'] }, { $add: ['$amount'] }, 0],
        },
      },
    },
  });

  const statusAggregation = await TransactionModel.aggregate(statusAggregationPipeline);

  const statusSummary: Record<
    string,
    { count: number; totalInrAmount: number; totalUsdAmount: number }
  > = {
    paid: { count: 0, totalInrAmount: 0, totalUsdAmount: 0 },
    created: { count: 0, totalInrAmount: 0, totalUsdAmount: 0 },
  };

  statusAggregation.forEach(({ _id, count, totalInrAmount, totalUsdAmount }) => {
    statusSummary[_id] = { count, totalInrAmount, totalUsdAmount };
  });

  return {
    transactions,
    totalTransactions,
    status: statusSummary,
    totalPages: Math.ceil(totalTransactionsForPages / limit),
    currentPage: page,
  };
};

export const TransactionServices = {
  createOrderIntoRazorpay,
  verifyTransactionManually,
  createBulkDirectorDataCouponCodeIntoDB,
  getTransactionWithPagination,
};
