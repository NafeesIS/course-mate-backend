// import supertokens from 'supertokens-node';
import httpStatus from 'http-status';
import UserMetadata from 'supertokens-node/recipe/usermetadata';
import AppError from '../../errors/AppError';
import { IBillingDetails } from './user.interface';
import { UserModel } from './user.model';
const getUserInfoFromST = async (userId: string) => {
  // const userInfoSupertokenn = await supertokens.getUser(userId);
  const userInfo = await UserModel.findOne({ uId: userId }).populate({
    path: 'bulk_unlock_credits',
    select: 'availableCredits creditType expiryDate -_id',
  });

  // const { metadata } = await UserMetadata.getUserMetadata(userId);
  // console.log('Meta info', metadata);
  return userInfo;
};

const getUserById = async (userId: string) => {
  const user = await UserModel.findById(userId)
    .select('emails timeJoined lastLogin meta_data phoneNumbers profilePicture')
    .populate({
      path: 'orders',
      select:
        'orderId items value gst gstNumber status paymentId currency discount_amount coupon createdAt',
    })
    .populate({
      path: 'subscriptions',
      select: 'orderId paymentId plan options amount startDate endDate status fileSentHistory',
    })
    .populate({
      path: 'bulk_unlock_credits',
      select: 'availableCredits expiryDate createdAt creditType -_id',
    });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  return user;
};

const updateUserInfo = async (userId: string, data: Record<string, string>) => {
  const { first_name, last_name, mobile_number } = data;
  await UserMetadata.updateUserMetadata(userId, {
    first_name,
    last_name,
    mobile_number,
  });

  //update user info in db
  const updatedUser = await UserModel.updateOne(
    { uId: userId },
    {
      $set: {
        'meta_data.firstName': first_name,
        'meta_data.lastName': last_name,
        'meta_data.mobileNumber': mobile_number,
      },
    }
  );

  return updatedUser;
};

const addBillingDetails = async (userId: string, billingDetails: IBillingDetails) => {
  const user = await UserModel.findOne({ uId: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.billingDetails.length === 0 || billingDetails.isDefault) {
    // Set all existing billing details to non-default
    user.billingDetails.forEach(detail => (detail.isDefault = false));
  }

  user.billingDetails.push(billingDetails);
  await user.save();
  return user;
};

const updateBillingDetails = async (
  userId: string,
  _billingDetailsId: string,
  updatePayload: Partial<IBillingDetails>
) => {
  const user = await UserModel.findOne({ uId: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const billingDetailIndex = user.billingDetails.findIndex(
    detail => detail._id?.toString() === _billingDetailsId
  );
  if (billingDetailIndex === -1) {
    throw new AppError(httpStatus.NOT_FOUND, 'Billing details not found');
  }

  Object.assign(user.billingDetails[billingDetailIndex], updatePayload);

  if (updatePayload.isDefault) {
    // Set all other billing details to non-default
    user.billingDetails.forEach(detail => {
      if (detail._id?.toString() !== _billingDetailsId) {
        detail.isDefault = false;
      }
    });
  }

  await user.save();
  return user;
};

const getDefaultBillingDetails = async (userId: string) => {
  const user = await UserModel.findOne({ uId: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  return user.billingDetails.find(detail => detail.isDefault) || null;
};

const deleteBillingDetails = async (userId: string, _billingDetailsId: string) => {
  const user = await UserModel.findOne({ uId: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const billingDetailIndex = user.billingDetails.findIndex(
    detail => detail._id?.toString() === _billingDetailsId
  );
  if (billingDetailIndex === -1) {
    throw new AppError(httpStatus.NOT_FOUND, 'Billing details not found');
  }

  const deletedDetail = user.billingDetails.splice(billingDetailIndex, 1)[0];

  // If the deleted detail was the default, set a new default if other details exist
  if (deletedDetail.isDefault && user.billingDetails.length > 0) {
    user.billingDetails[0].isDefault = true;
  }

  await user.save();
  return user;
};

const searchUserByEmailOrPhone = async (email: string, phone: string) => {
  const query: { $or?: Array<{ [key: string]: string }> } = {};
  if (email) {
    query['$or'] = [{ emails: email }, { 'billingDetails.email': email }];
  }

  if (phone) {
    query['$or'] = [
      ...(query['$or'] || []),
      { phoneNumbers: phone },
      { 'billingDetails.mobileNumber': phone },
      { 'meta_data.mobileNumber': phone },
    ];
  }
  const user = await UserModel.findOne(query).select(
    'emails phoneNumbers meta_data.firstName meta_data.lastName meta_data.mobileNumber'
  );
  return user;
};

const getUsersWithPagination = async (
  page: number,
  limit: number,
  searchQuery: { name?: string; email?: string; phone?: string }
) => {
  const query: { $or?: Array<{ [key: string]: string | RegExp }> } = {};

  if (searchQuery.name) {
    query['$or'] = [
      { 'meta_data.firstName': new RegExp(searchQuery.name, 'i') },
      { 'meta_data.lastName': new RegExp(searchQuery.name, 'i') },
    ];
  }

  if (searchQuery.email) {
    query['$or'] = [
      ...(query['$or'] || []),
      { emails: searchQuery.email },
      { 'billingDetails.email': searchQuery.email },
    ];
  }

  if (searchQuery.phone) {
    query['$or'] = [
      ...(query['$or'] || []),
      { phoneNumbers: searchQuery.phone },
      { 'billingDetails.mobileNumber': searchQuery.phone },
      { 'meta_data.mobileNumber': searchQuery.phone },
    ];
  }

  const users = await UserModel.find(query)
    .select('emails lastLogin timeJoined meta_data phoneNumbers profilePicture')
    .populate({
      path: 'orders',
      select:
        'orderId items value gst status gstNumber paymentId currency discount_amount coupon createdAt',
      // populate: {
      //   path: 'items',
      //   select: 'serviceName',
      // },
    })
    .populate({
      path: 'subscriptions',
      select: 'orderId plan options amount paymentId startDate endDate status fileSentHistory',
    })
    .populate({
      path: 'bulk_unlock_credits',
      select: 'availableCredits expiryDate createdAt creditType -_id',
    })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalUsers = await UserModel.countDocuments(query);

  return {
    users,
    totalUsers,
    totalPages: Math.ceil(totalUsers / limit),
    currentPage: page,
  };
};

const updateAdminAuthorMetaDataIntoDB = async (
  userId: string,
  data: Record<string, string>,
  avatarUrl?: string
) => {
  const { first_name, last_name, mobile_number, bio, linkedin, facebook, github } = data;
  await UserMetadata.updateUserMetadata(userId, {
    first_name,
    last_name,
    mobile_number,
  });
  // Update embedded meta_data in UserModel
  const updatedUser = await UserModel.updateOne(
    { uId: userId },
    {
      $set: {
        'meta_data.firstName': first_name,
        'meta_data.lastName': last_name,
        'meta_data.mobileNumber': mobile_number,
        'meta_data.bio': bio,
        'meta_data.avatarUrl': avatarUrl,
        'meta_data.social.linkedin': linkedin,
        'meta_data.social.facebook': facebook,
        'meta_data.social.github': github,
      },
    }
  );

  return updatedUser;
};

export const UserService = {
  getUserInfoFromST,
  getUserById,
  updateUserInfo,
  addBillingDetails,
  updateBillingDetails,
  getDefaultBillingDetails,
  deleteBillingDetails,
  searchUserByEmailOrPhone,
  getUsersWithPagination,
  updateAdminAuthorMetaDataIntoDB,
};
