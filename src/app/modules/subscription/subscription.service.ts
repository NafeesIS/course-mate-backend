/* eslint-disable quotes */
/* eslint-disable indent */
import { addDays, addMonths } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import httpStatus from 'http-status';
import mongoose, { ClientSession } from 'mongoose';
import AppError from '../../errors/AppError';
import { ServiceCatalogModel } from '../serviceCatalog/serviceCatalog.model';
import { UserModel } from '../user/user.model';
import { TEmailHistoryQuery, TSubscription } from './subscription.interface';
import { EmailHistoryModel, SubscriptionModel } from './subscription.model';

const createSubscriptionIntoDB = async (payload: TSubscription, session: ClientSession) => {
  const { orderId, serviceId, paymentId, plan, userId, amount, options, includedStates } = payload;
  //find service from the service catalog
  const service = await ServiceCatalogModel.findById(payload.serviceId).session(session);
  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, 'ServiceCatalog not found');
  }

  // Get current UTC time
  const utcNow = new Date();

  // Convert UTC to IST for calculations
  const istTime = toZonedTime(utcNow, 'Asia/Kolkata');

  // Set start date to 12:00 AM IST of the current day
  const startDateIST = new Date(istTime);
  startDateIST.setHours(0, 0, 0, 0);

  // Convert IST start date to UTC for storage
  const startDate = new Date(
    formatInTimeZone(startDateIST, 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ssXXX")
  );

  let endDateIST = new Date(startDateIST);
  let graceDate;

  switch (payload.plan) {
    case 'monthly':
      endDateIST = addMonths(startDateIST, 1);
      break;
    case 'quarterly':
      endDateIST = addMonths(startDateIST, 3);
      break;
    case 'annually':
      endDateIST = addMonths(startDateIST, 12);
      break;
    case 'trial':
      endDateIST = addDays(startDateIST, 2);
      break;
    default:
      return new AppError(httpStatus.BAD_REQUEST, 'Invalid plan');
  }

  // Set end date to 11:59:59 PM IST
  endDateIST.setHours(23, 59, 59, 999);

  // Convert IST end date to UTC for storage
  const endDate = new Date(
    formatInTimeZone(endDateIST, 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ssXXX")
  );

  // Log the times for debugging
  console.log('UTC Now:', utcNow.toISOString());
  console.log('IST Time:', istTime.toISOString());
  console.log('Start Date (UTC):', startDate.toISOString());
  console.log('End Date (UTC):', endDate.toISOString());

  const subscription = new SubscriptionModel({
    userId,
    orderId,
    serviceId,
    paymentId,
    amount,
    options,
    plan,
    startDate,
    endDate,
    graceDate,
    includedStates,
  });
  await subscription.save({ session });
  return subscription;
};

const getSubscriptionDetailsFromDB = async (query: Record<string, unknown>) => {
  const subscriptions = await SubscriptionModel.findById(query.subscriptionId)
    .populate('userId')
    .populate('serviceId');
  return subscriptions;
};

const getAllSubscriberEmailsFromDB = async () => {
  const currentDate = new Date();

  // Step 1: Find subscriptions valid for the current date
  const activeSubscriptions = await SubscriptionModel.find({
    startDate: { $lte: currentDate },
    endDate: { $gte: currentDate },
    // status: 'active', // Include this if the status is relevant
  }).populate({
    path: 'userId', // Populate the userId field
    select: 'emails', // Select only the emails field from User
  });

  // Fix: Add proper type for populated userId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emails = activeSubscriptions.flatMap(sub => (sub.userId as any)?.emails || []);

  return emails;
};

const getAllSubscriptionDetailsFromDB = async (query: Record<string, unknown>) => {
  const { status } = query;
  const queryFilter = status === 'all' ? {} : { status };
  const subscriptions = await SubscriptionModel.find(queryFilter)
    .populate({ path: 'userId', select: 'meta_data emails _id' })
    .populate({ path: 'serviceId', select: 'name description -_id' })
    .populate({ path: 'orderId', select: 'orderId paymentId value gst status -_id' })
    .select('-_id -__v')
    .sort({ startDate: -1 });
  return subscriptions;
};

// const getAllSubscriptionDetailsFromDB = async () => {
//   const startDate = new Date('2024-12-01');
//   const endDate = new Date('2025-01-16');

//   const subscriptions = await SubscriptionModel.find({
//     startDate: {
//       $gte: startDate,
//       $lte: endDate,
//     },
//   })
//     .populate({
//       path: 'userId',
//       select: 'meta_data emails billingDetails',
//     })
//     .populate({
//       path: 'serviceId',
//       select: 'name',
//     })
//     .sort({ startDate: -1 });

//   return subscriptions.map(subscription => {
//     const userMeta = subscription.userId?.meta_data;
//     const billingDetails = subscription.userId?.billingDetails?.[0];
//     const emails = subscription.userId?.emails;

//     return {
//       name: `${userMeta?.firstName} ${userMeta?.lastName}`,
//       phone: userMeta?.mobileNumber || billingDetails?.mobileNumber,
//       email: emails?.[0],
//       planName: subscription.serviceId?.name,
//       duration: subscription.plan,
//       amount: subscription.amount,
//       zone: subscription.options?.join(', '),
//       planBoughtOn: subscription.startDate,
//       planExpiringOn: subscription.endDate,
//     };
//   });
// };

// === Get Multiple Subscriptions by Array of IDs (for user dashboard) ===
const getSubscriptionsByIdsFromDB = async (subscriptionIds: string[]) => {
  const subscriptions = await SubscriptionModel.find({
    _id: { $in: subscriptionIds },
  })
    .select(
      '_id userId serviceId orderId paymentId plan options amount startDate endDate status includedStates'
    )
    .lean();

  return subscriptions;
};

// === Get Email History by User ID with Pagination, Filtering, and Authorization ===
// This function retrieves a paginated, filtered list of email history records for a specific user.
// It enforces that only the user themselves can access their email history, and supports filtering by process and email sent dates.
const getEmailHistoryByUserIdFromDB = async (query: TEmailHistoryQuery, sessionUser: string) => {
  // 1. Destructure and set defaults for pagination and sorting from the query object
  const {
    userId, // string (required)
    page = 1, // number (optional, default 1)
    limit = 10, // number (optional, default 10)
    sortBy = 'processDate', // string (optional, default 'processDate')
    sortOrder = 'desc', // 'asc' | 'desc' (optional, default 'desc')
    processDate, // string (ISO 8601 UTC, e.g., 2025-07-01T00:00:00.000Z)
    processEndDate, // string (ISO 8601 UTC, e.g., 2025-07-05T00:00:00.000Z)
  } = query;

  // 2. Fetch the user from the database to verify existence
  const user = await UserModel.findById(userId);
  if (!user) {
    // If user does not exist, throw a 404 error
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // 3. Authorization: Ensure the session user matches the requested user
  //    Only allow users to access their own email history
  if (user.uId !== sessionUser) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to access this resource');
  }

  // 4. Build the MongoDB filter object for querying email history
  const filter: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };

  // 5. Add processDate filtering if provided
  //    - If both processDate and processEndDate are provided, filter for records between those dates (inclusive)
  //    - If only processDate is provided, filter for that single day
  if (processDate && processEndDate) {
    const start = new Date(processDate);
    const end = new Date(processEndDate);
    end.setUTCHours(23, 59, 59, 999); // Set end to end of the day
    filter.processDate = { $gte: start, $lte: end };
  } else if (processDate) {
    const start = new Date(processDate);
    const end = new Date(processDate);
    end.setUTCHours(23, 59, 59, 999);
    filter.processDate = { $gte: start, $lte: end };
  }

  // 6. Add emailSentDate filtering if provided (optional)
  if (query.emailSentDate && query.emailSentEndDate) {
    const start = new Date(query.emailSentDate);
    const end = new Date(query.emailSentEndDate);
    end.setUTCHours(23, 59, 59, 999);
    filter.emailSentDate = { $gte: start, $lte: end };
  } else if (query.emailSentDate) {
    const start = new Date(query.emailSentDate);
    const end = new Date(query.emailSentDate);
    end.setUTCHours(23, 59, 59, 999);
    filter.emailSentDate = { $gte: start, $lte: end };
  }
  // If neither is provided, all records for the user are returned

  // 7. Build the sort object for MongoDB
  //    - sortBy: which field to sort on
  const sort: Record<string, 1 | -1> = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // 8. Calculate skip for pagination
  const skip: number = (Number(page) - 1) * Number(limit);

  // 9. Define projection to limit returned fields
  const projection = {
    _id: 1,
    subscriptionId: 1,
    userId: 1,
    orderId: 1,
    dataType: 1,
    processDate: 1,
    emailSentDate: 1,
    blobUrl: 1,
    fileName: 1,
    fileSize: 1,
    stateWiseData: 1,
    emailStatus: 1,
    planType: 1,
    // createdAt: 1,
    // updatedAt: 1,
  };

  // 10. Fetch data and total count in parallel for efficiency
  const [data, total] = await Promise.all([
    EmailHistoryModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .select(projection)
      .lean(),
    EmailHistoryModel.countDocuments(filter),
  ]);

  // 11. Return paginated result with meta information
  //     - meta: pagination info (page, limit, total, totalPages)
  //     - data: array of email history records
  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
    data,
  };
};

const getEmailHistoryForAdminFromDB = async (query: TEmailHistoryQuery, sessionUser: string) => {
  // 1. Destructure and set defaults for pagination and sorting from the query object
  const {
    userId, // string (required)
    page = 1, // number (optional, default 1)
    limit = 10, // number (optional, default 10)
    sortBy = 'processDate', // string (optional, default 'processDate')
    sortOrder = 'desc', // 'asc' | 'desc' (optional, default 'desc')
    processDate, // string (ISO 8601 UTC, e.g., 2025-07-01T00:00:00.000Z)
    processEndDate, // string (ISO 8601 UTC, e.g., 2025-07-05T00:00:00.000Z)
    orderId,
  } = query;

  // 2. Fetch the user from the database to verify existence
  const user = await UserModel.findById(userId);
  if (!user) {
    // If user does not exist, throw a 404 error
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // 3. Authorization: Ensure the session user matches the requested user
  //    Only allow users to access their own email history
  if (user.uId !== sessionUser) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to access this resource');
  }
  const isAdmin = user.roles.includes('admin');
  // 4. Build the MongoDB filter object for querying email history
  const filter: Record<string, unknown> = isAdmin
    ? { orderId: orderId }
    : { userId: new mongoose.Types.ObjectId(userId) };

  // 5. Add processDate filtering if provided
  //    - If both processDate and processEndDate are provided, filter for records between those dates (inclusive)
  //    - If only processDate is provided, filter for that single day
  if (processDate && processEndDate) {
    const start = new Date(processDate);
    const end = new Date(processEndDate);
    end.setUTCHours(23, 59, 59, 999); // Set end to end of the day
    filter.processDate = { $gte: start, $lte: end };
  } else if (processDate) {
    const start = new Date(processDate);
    const end = new Date(processDate);
    end.setUTCHours(23, 59, 59, 999);
    filter.processDate = { $gte: start, $lte: end };
  }

  // 6. Add emailSentDate filtering if provided (optional)
  if (query.emailSentDate && query.emailSentEndDate) {
    const start = new Date(query.emailSentDate);
    const end = new Date(query.emailSentEndDate);
    end.setUTCHours(23, 59, 59, 999);
    filter.emailSentDate = { $gte: start, $lte: end };
  } else if (query.emailSentDate) {
    const start = new Date(query.emailSentDate);
    const end = new Date(query.emailSentDate);
    end.setUTCHours(23, 59, 59, 999);
    filter.emailSentDate = { $gte: start, $lte: end };
  }
  // If neither is provided, all records for the user are returned

  // 7. Build the sort object for MongoDB
  //    - sortBy: which field to sort on
  const sort: Record<string, 1 | -1> = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // 8. Calculate skip for pagination
  const skip: number = (Number(page) - 1) * Number(limit);

  // 9. Define projection to limit returned fields
  const projection = {
    _id: 1,
    subscriptionId: 1,
    userId: 1,
    orderId: 1,
    dataType: 1,
    processDate: 1,
    emailSentDate: 1,
    blobUrl: 1,
    fileName: 1,
    fileSize: 1,
    stateWiseData: 1,
    emailStatus: 1,
    planType: 1,
    // createdAt: 1,
    // updatedAt: 1,
  };
  // 10. Fetch data and total count in parallel for efficiency
  const [data, total] = await Promise.all([
    EmailHistoryModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .select(projection)
      .lean(),
    EmailHistoryModel.countDocuments(filter),
  ]);

  // 11. Return paginated result with meta information
  //     - meta: pagination info (page, limit, total, totalPages)
  //     - data: array of email history records
  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
    data,
  };
};

export const SubscriptionServices = {
  createSubscriptionIntoDB,
  getSubscriptionDetailsFromDB,
  getAllSubscriberEmailsFromDB,
  getAllSubscriptionDetailsFromDB,
  getSubscriptionsByIdsFromDB,
  getEmailHistoryByUserIdFromDB,
  getEmailHistoryForAdminFromDB,
};
