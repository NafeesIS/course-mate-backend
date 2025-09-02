/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { Cashfree, PaymentEntity } from 'cashfree-pg';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import config from '../../config';
import AppError from '../../errors/AppError';

import { isValid } from 'date-fns';
import {
  sendConfirmationToWhatsapp,
  sendEmailWithAzure,
} from '../../utils/notification/notification';
import paymentConfirmationEmail from '../../utils/notification/templates/paymentConfirmationEmail';
import { CouponModel } from '../coupon/coupon.model';
import { CreditServices } from '../credits/credit.service';
import { MailchimpServices } from '../mailchimp/mailchimp.service';
import { SubscriptionModel } from '../subscription/subscription.model';
import { SubscriptionServices } from '../subscription/subscription.service';
import { UnlockCompanyServices } from '../unlockCompany/unlockCompany.service';
import { UserModel } from '../user/user.model';
import { TOrder } from './order.interface';
import { OrderModel } from './order.model';
import { calculateCartTotalsBackend } from './utils/cartCalculation';
import generateOrderId from './utils/generateOrderId';

Cashfree.XClientId =
  config.FSEnvironment === 'production' ? config.cashFree_live_ID : config.cashFree_test_ID;
Cashfree.XClientSecret =
  config.FSEnvironment === 'production'
    ? config.cashFree_live_secretKey
    : config.cashFree_test_secretKey;
Cashfree.XEnvironment =
  config.FSEnvironment === 'production'
    ? Cashfree.Environment.PRODUCTION
    : Cashfree.Environment.SANDBOX;

const createOrderIntoDB = async (payload: TOrder) => {
  const {
    userId,
    userName,
    userContact,
    items,
    gstNumber,
    currency, // to be check to verify which price to validate
    coupon,
    billingDetails,
    returnUrl,
  } = payload;

  const orderId = generateOrderId();
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const { verifiedItems, value, gst, totalPrice, discount, backendVerifiedCoupon } =
    await calculateCartTotalsBackend({
      items: items,
      currency: currency,
      userId: userId.toString(),
      coupon: coupon,
    });

  // Calculate total item price
  // const totalItemPrice = items.reduce((total, item) => total + item.price * item.quantity, 0);

  // Re-verify the coupon
  // if (coupon && coupon.code) {
  //   const verifiedCoupon = await CouponServices.verifyCouponFromDB({
  //     code: coupon.code,
  //     orderValue: totalItemPrice,
  //     userId: userId.toString(),
  //     serviceIds: items.map(item => item.serviceId.toString()),
  //   });

  // Calculate the expected discount
  // const expectedDiscountAmount = verifiedCoupon.discount;

  // Validate the discount amount
  // if (discount_amount !== expectedDiscountAmount) {
  //   throw new AppError(
  //     httpStatus.BAD_REQUEST,
  //     'The discount amount does not match our records. This could be due to an unexpected change or manipulation. Please try again or contact support if the issue persists.'
  //   );
  // }

  const newOrder = new OrderModel({
    userId,
    orderId,
    items: verifiedItems,
    value,
    gst,
    gstNumber,
    currency,
    coupon: backendVerifiedCoupon,
    discount_amount: discount,
    billingDetails,
  });

  // const totalPrice = parseFloat((value + gst).toFixed(2));

  // Prepare data for Cashfree order creation
  const cashfreeOrderData = {
    order_id: orderId,
    order_amount: totalPrice,
    order_currency: currency,
    customer_details: {
      customer_id: user.uId,
      customer_email: user.emails[0],
      // // customer_phone: user.phoneNumbers.length > 0 ? user.phoneNumbers[0] : '',
      customer_phone: userContact,
      customer_name: userName, //TODO: change this to name from user
    },
    order_meta: {
      return_url: `${returnUrl}?order_id=${orderId}`,
      // return_url: `https://localhost:3000/dashboard/director-contacts/unlock-contact?success=true?order_id=${orderId}`,
      notify_url: 'https://www.cashfree.com/devstudio/preview/pg/webhooks/96589173',
    },
    // order_tags: items.reduce(
    //   (tags, item, index) => {
    //     // Add item-specific tags
    //     tags[`item_${index}_id`] = item.serviceId.toString();
    //     tags[`item_${index}_name`] = item.serviceName;
    //     tags[`item_${index}_type`] = item.serviceType;

    //     // Add custom attributes as tags
    //     Object.entries(item.customAttributes || {}).forEach(([key, value]) => {
    //       tags[`item_${index}_${key}`] = value?.toString() || 'null';
    //     });

    //     return tags;
    //   },
    //   {} as Record<string, string>
    // ),
  };

  try {
    const response = await Cashfree.PGCreateOrder('2023-08-01', cashfreeOrderData);
    const order = await newOrder.save();
    await UserModel.updateOne({ _id: userId }, { $push: { orders: order._id } });
    return response.data;
  } catch (error: any) {
    console.log(error.response.data);
    throw new AppError(httpStatus.BAD_REQUEST, error.response.data.message);
  }
};

const verifyPaymentFromCashFree = async (orderId: string, sessionUser: string) => {
  let orderStatus: 'CREATED' | 'PENDING' | 'PAID' | 'FAILED' | 'UNKNOWN' = 'CREATED';
  let message;
  let paymentId;
  const subscriptionId = [];

  // Use a session to ensure all operations are atomic
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await Cashfree.PGFetchOrder('2023-08-01', orderId);
    const orderResponse = response.data;

    // TODO: uncomment following code for method PGOrderFetchPayments
    // const successfulOrder = orderResponse.find(
    //   transaction => transaction.payment_status === 'SUCCESS'
    // );
    // const pendingOrder = orderResponse.find(transaction => transaction.payment_status === 'PENDING');
    // const failedOrder = orderResponse.find(
    //   transaction =>
    //     transaction.payment_status === 'FAILED' || transaction.payment_status === 'USER_DROPPED'
    // );

    // from PGFetchOrder it returns in object with possible order status value  ACTIVE: Order does not have a sucessful transaction yet ,PAID: Order is PAID with one successful transaction EXPIRED: Order was not PAID and not it has expired. No transaction can be initiated for an EXPIRED order. TERMINATED: Order terminated TERMINATION_REQUESTED: Order termination requested. what i want to do is first fetch the order. if order status is paid only then i will call PGOrderFetchPayments to get the payment details. from there i will get the cf_payment_id and then i will update the order status to paid. for other status i will return the order status as it is. also i need to use my current structure of code of successfulOrder, pendingOrder, failedOrder.

    let successfulOrder: PaymentEntity | undefined;
    let pendingOrder;
    let failedOrder;

    if (orderResponse.order_status === 'PAID') {
      const paymentResponse = await Cashfree.PGOrderFetchPayments('2023-08-01', orderId);
      successfulOrder = paymentResponse.data.find(
        transaction => transaction.payment_status === 'SUCCESS'
      );
    }

    if (orderResponse.order_status === 'ACTIVE') {
      pendingOrder = orderResponse;
    }

    if (orderResponse.order_status === 'EXPIRED') {
      failedOrder = orderResponse;
    }

    const order = await OrderModel.findOne({ orderId }).session(session);

    if (!order) {
      throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
    }

    const _userId = order.userId;

    const user = await UserModel.findById(_userId);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    if (successfulOrder) {
      orderStatus = 'PAID';
      paymentId = successfulOrder.cf_payment_id;

      if (order.isProcessed) {
        await session.abortTransaction();
        return {
          message: 'This order has already been verified.',
          orderStatus: order.status,
          paymentId: order.paymentId,
          totalAmount: order.value + order.gst,
        };
      }

      // Process the order items
      for (const item of order.items) {
        if (item.serviceType === 'subscription' && item.customAttributes?.plan) {
          const existingSubscription = await SubscriptionModel.findOne({ orderId }).session(
            session
          );
          if (existingSubscription) {
            message = 'Payment successful, but subscription already exist. Please contact support';
            subscriptionId.push(existingSubscription._id);
            break;
          }
          const subscriptionPayload = {
            serviceId: item.serviceId,
            plan: item.customAttributes.plan,
            userId: _userId,
            amount: item.price,
            options: item.customAttributes?.options,
            orderId: order.orderId,
            paymentId,
            includedStates: item.customAttributes?.includedStates,
          };
          const subscription = await SubscriptionServices.createSubscriptionIntoDB(
            subscriptionPayload,
            session
          );

          if ('_id' in subscription) {
            await UserModel.updateOne(
              { _id: _userId },
              { $push: { subscriptions: subscription._id } }
            ).session(session);
            subscriptionId.push(subscription._id);

            // MAILCHIMP integration: send the user to MAILCHIMP list
            const tag =
              subscriptionPayload.plan === 'trial'
                ? 'nca_trial_new_subscriber'
                : 'nca_fullplan_subscriber';
            await MailchimpServices.addOrUpdateUserToAudience({
              email: user.emails[0],
              firstName: user.meta_data?.firstName,
              lastName: user.meta_data?.lastName,
              tags: [tag],
            });
          } else {
            message =
              'Payment successful, but subscription could not be created. Please contact support';
          }
        } else if (
          item.serviceType === 'directorUnlock' &&
          item.customAttributes?.bulkUnlockCredits
        ) {
          const creditsToAdd = item.customAttributes.bulkUnlockCredits;
          const expiryDays = 365;

          const bulkCredit = await CreditServices.addUnlockCreditIntoDB(
            _userId.toString(),
            creditsToAdd,
            expiryDays,
            'directorUnlock',
            session
          );

          if (bulkCredit) {
            message = `Payment successful! You have been credited with ${creditsToAdd} unlock credits.`;
          } else {
            message =
              'Payment successful, but credits could not be applied. Please contact support.';
          }
        } else if (
          item.serviceType === 'companyUnlock' &&
          item.customAttributes &&
          item.customAttributes.companyUnlockCredits
        ) {
          const creditsToAdd = item.customAttributes.companyUnlockCredits;
          const expiryDays = 365;

          const companyCredit = await CreditServices.addUnlockCreditIntoDB(
            _userId.toString(),
            creditsToAdd,
            expiryDays,
            item.serviceType,
            session
          );

          if (companyCredit.availableCredits >= 1) {
            if (item.customAttributes.companyId) {
              await UnlockCompanyServices.unlockCompanyWithCreditWhilePaymentVerification(
                _userId.toString(),
                item.customAttributes.companyId,
                item.serviceType,
                sessionUser,
                session
              );
            }
            message = `Payment successful! You have been credited with ${creditsToAdd} company unlock credits.`;
          } else {
            message =
              'Payment successful, but credits could not be applied. Please contact support.';
          }
        } else if (
          item.serviceType === 'vpdUnlock' &&
          item.customAttributes &&
          item.customAttributes.companyId &&
          item.customAttributes.companyName
        ) {
          const { job, unlockedCompany } =
            await UnlockCompanyServices.createVpdUnlockJobAndUnlockedCompany(
              _userId.toString(),
              item.customAttributes.companyId,
              item.customAttributes.companyName,
              session
            );

          if (job && unlockedCompany) {
            message = 'Payment successful! Your VPD unlock request has been initiated.';
          } else {
            message =
              'Payment successful, but VPD unlock request could not be initiated. Please contact support.';
          }
        }
      }

      order.status = orderStatus;
      order.paymentId = paymentId || null;
      order.isProcessed = true;
      await order.save({ session });

      if (orderStatus === 'PAID') {
        const emailData = {
          // to: order.userId.emails[0],
          orderId: order.orderId,
          items: order.items.map(item => ({
            serviceId: item.serviceId,
            currency: item.currency,
            serviceName: item.serviceName,
            price: item.price,
            quantity: item.quantity,
            serviceType: item.serviceType,
            customAttributes: item.customAttributes,
          })),
          totalAmount: order.value + order.gst,
          currency: order.currency,
          coupon: order.coupon
            ? {
                code: order.coupon.code,
                type: order.coupon.type,
                value: order.coupon.value,
                discount: order.discount_amount,
              }
            : undefined,
          // subscriptionIds: subscriptionId.length > 0 ? subscriptionId : undefined,
        };

        await sendEmailWithAzure(
          user.emails[0],
          `Payment Confirmation for Order #${order.orderId.replace(/\D/g, '')}`,
          paymentConfirmationEmail(emailData)
        );

        if (user.meta_data?.mobileNumber && user.meta_data?.firstName) {
          await sendConfirmationToWhatsapp({
            phoneNumbers: [user.meta_data.mobileNumber],
            components: {
              body_1: user.meta_data.firstName,
              body_2: order.currency,
              body_3: (order.value + order.gst).toString(),
              body_4: order.orderId,
            },
          });
        }
      }

      // Update coupon redemptions and track user usage
      if (order.coupon && order.coupon.code) {
        await CouponModel.updateOne(
          { code: order.coupon.code },
          {
            $inc: { redemptions: 1 }, // Increment the redemptions count
            $push: { usedBy: order.userId }, // Allow multiple entries of the same user
          }
        ).session(session);
      }
    } else if (pendingOrder) {
      orderStatus = 'PENDING';
      //send the message that Order does not have a sucessful transaction yet and payment is pending once user made the payment it will be updated
      message = 'Order does not have a successful transaction yet and payment is pending';
    } else if (failedOrder) {
      orderStatus = 'FAILED';
      //send the message that order payment is expired thus no payment can be made now and order status is failed
      message = 'Order payment session is expired';
    } else {
      orderStatus = 'UNKNOWN';
      message = 'An unknown error occurred. Please contact support.';
    }
    order.status = orderStatus;
    order.paymentId = paymentId || null;
    await order.save({ session });
    await session.commitTransaction();
    return {
      message,
      orderStatus,
      subscriptionId,
      paymentId,
      totalAmount: order.value + order.gst,
    };
  } catch (error: any) {
    await session.abortTransaction();

    if (error.response?.status === 404) {
      throw new AppError(httpStatus.NOT_FOUND, 'Order not found in cashfree payment system');
    }
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      if (error.keyPattern?.userId && error.keyPattern?.companyId) {
        throw new AppError(
          httpStatus.CONFLICT,
          'This company has already been unlocked for this user'
        );
      }
      throw new AppError(
        httpStatus.CONFLICT,
        'Duplicate record detected. This item has already been processed.'
      );
    }
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to verify payment');
  } finally {
    await session.endSession();
  }
};

const getOrderDetailsFromDB = async (sessionUser: string, orderId: string) => {
  const order = await OrderModel.findOne({ orderId });
  const user = await UserModel.findById(order?.userId);

  //check whether uId match with session user id
  if (user?.uId !== sessionUser) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to access this resource');
  }

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }

  return order;
};

const getMultipleOrderDetailsFromDB = async (orderIds: string[]) => {
  const orders = await OrderModel.find({ orderId: { $in: orderIds } });

  if (!orders.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'No orders found');
  }

  return orders;
};

const getOrdersWithPagination = async (
  page: number,
  limit: number,
  searchQuery: {
    status?: string;
    orderId?: string;
    paymentId?: string;
    gstNumber?: string;
    email?: string;
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

  if (searchQuery.orderId) {
    query['$or'] = [...(query['$or'] || []), { orderId: searchQuery.orderId }];
  }

  if (searchQuery.paymentId) {
    query['$or'] = [...(query['$or'] || []), { paymentId: searchQuery.paymentId }];
  }

  if (searchQuery.gstNumber) {
    query['$or'] = [...(query['$or'] || []), { gstNumber: searchQuery.gstNumber }];
  }

  if (searchQuery.email) {
    const users = await UserModel.find({ emails: new RegExp(searchQuery.email, 'i') }, { _id: 1 });

    const userIds = users.map(user => user._id);
    if (userIds.length) {
      query['$or'] = [...(query['$or'] || []), { userId: { $in: userIds } }];
    }
  }

  if (searchQuery.status) {
    query.status = searchQuery.status;
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

  const orders = await OrderModel.find(query)
    .select(
      'orderId items value gst gstNumber status paymentId currency discount_amount coupon createdAt'
    )
    .populate({
      path: 'userId',
      select: 'uId meta_data.firstName meta_data.lastName emails meta_data.mobileNumber',
    })
    .sort({ createdAt: sortOption })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalOrders = await OrderModel.countDocuments();
  const totalOrdersForPages = await OrderModel.countDocuments(query);

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
  if (searchQuery.gstNumber) {
    statisticsMatchQuery['$or'] = [
      ...(statisticsMatchQuery['$or'] || []),
      { gstNumber: searchQuery.gstNumber },
    ];
  }

  if (searchQuery.email) {
    const users = await UserModel.find({ emails: new RegExp(searchQuery.email, 'i') }, { _id: 1 });

    const userIds = users.map(user => user._id);
    if (userIds.length) {
      statisticsMatchQuery['$or'] = [
        ...(statisticsMatchQuery['$or'] || []),
        { userId: { $in: userIds } },
      ];
    }
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
          $cond: [{ $eq: ['$currency', 'INR'] }, { $add: ['$value', '$gst'] }, 0],
        },
      },
      totalUsdAmount: {
        $sum: {
          $cond: [{ $eq: ['$currency', 'USD'] }, { $add: ['$value', '$gst'] }, 0],
        },
      },
    },
  });

  const statusAggregation = await OrderModel.aggregate(statusAggregationPipeline);

  const statusSummary: Record<
    string,
    { count: number; totalInrAmount: number; totalUsdAmount: number }
  > = {
    PAID: { count: 0, totalInrAmount: 0, totalUsdAmount: 0 },
    CREATED: { count: 0, totalInrAmount: 0, totalUsdAmount: 0 },
    FAILED: { count: 0, totalInrAmount: 0, totalUsdAmount: 0 },
    UNKNOWN: { count: 0, totalInrAmount: 0, totalUsdAmount: 0 },
    PENDING: { count: 0, totalInrAmount: 0, totalUsdAmount: 0 },
  };

  statusAggregation.forEach(({ _id, count, totalInrAmount, totalUsdAmount }) => {
    statusSummary[_id] = { count, totalInrAmount, totalUsdAmount };
  });

  return {
    orders,
    totalOrders,
    status: statusSummary,
    totalPages: Math.ceil(totalOrdersForPages / limit),
    currentPage: page,
  };
};

export const OrderServices = {
  createOrderIntoDB,
  verifyPaymentFromCashFree,
  getOrderDetailsFromDB,
  getMultipleOrderDetailsFromDB,
  getOrdersWithPagination,
};
