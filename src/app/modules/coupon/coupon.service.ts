import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { OrderModel } from '../order/order.model';
import { ServiceCatalogModel } from '../serviceCatalog/serviceCatalog.model';
import { ICoupon } from './coupon.interface';
import { CouponModel } from './coupon.model';
import { generateCouponCode } from './utils/generateCouponCode';

const createCouponIntoDB = async (payload: ICoupon) => {
  // Use the provided code or generate a new one
  const couponCode = payload.code || generateCouponCode();
  const coupon = await CouponModel.create({ ...payload, code: couponCode });
  return coupon;
};

const verifyCouponFromDB = async (payload: {
  code: string;
  orderValue: number;
  userId: string;
  serviceIds: string[];
}) => {
  const { code, orderValue, userId, serviceIds } = payload;

  const coupon = await CouponModel.findOne({ code });

  if (!coupon) {
    throw new AppError(httpStatus.NOT_FOUND, 'Coupon not found');
  }
  if (!coupon.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Coupon is inactive');
  }

  if (coupon.expiryDate < new Date()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Coupon has expired');
  }

  if (coupon.redemptions >= coupon.maxRedemptions) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Coupon has reached its maximum redemptions');
  }

  if (coupon.minimumOrderValue && orderValue < coupon.minimumOrderValue) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Minimum order value is ₹${coupon.minimumOrderValue}`
    );
  }

  if (coupon.isFirstTimeUser && userId) {
    const orders = await OrderModel.find({ userId, status: 'PAID' });
    if (orders.length > 0)
      throw new AppError(httpStatus.BAD_REQUEST, 'Coupon valid for first-time users only');
  }

  if (coupon.validUsers && coupon.validUsers.length > 0) {
    const isValidUser = coupon.validUsers.some(validUserId => validUserId.toString() === userId);
    if (!isValidUser) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Coupon is not valid for this user');
    }
  }

  if (coupon.maxRedemptionsPerUser) {
    const userRedemptions = await OrderModel.countDocuments({
      userId,
      'coupon.code': code,
      status: 'PAID',
    });

    if (userRedemptions >= coupon.maxRedemptionsPerUser) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `You have already used this coupon maximum ${coupon.maxRedemptionsPerUser} times`
      );
    }
  }

  if (coupon.validServices.length > 0) {
    // Check if all services in the cart are valid for this coupon
    const allServicesValid = serviceIds.every(serviceId =>
      coupon.validServices.some(validService => validService.toString() === serviceId)
    );

    if (!allServicesValid) {
      const validServices = await ServiceCatalogModel.find({
        _id: { $in: coupon.validServices },
      }).select('name');

      const validServiceNames = validServices.map(service => service.name).join(', ');
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Coupon is only valid when ALL services in cart are from: ${validServiceNames}`
      );
    }
  }

  //calculate discount
  const discount =
    coupon.type === 'percentage'
      ? (orderValue * coupon.value) / 100
      : coupon.type === 'flat'
        ? coupon.value
        : 0;

  return { code: coupon.code, type: coupon.type, value: coupon.value, discount };
};

const getAllCouponsFromDB = async () => {
  const coupons = await CouponModel.find({})
    .lean()
    .populate<{
      createdBy: {
        emails: string[];
        billingDetails: { firstName: string; lastName: string; mobileNumber: string }[];
        meta_data: { firstName: string; lastName: string; mobileNumber: string };
      };
    }>({
      path: 'createdBy',
      select: 'emails billingDetails meta_data',
    })
    .populate<{
      usedBy: {
        _id: string;
        emails: string[];
        billingDetails: { firstName: string; lastName: string; mobileNumber: string }[];
        meta_data: { firstName: string; lastName: string; mobileNumber: string };
      }[];
    }>({
      path: 'usedBy',
      select: '_id emails billingDetails meta_data',
    })
    .populate<{
      validUsers: {
        _id: string;
        emails: string[];
        billingDetails: { firstName: string; lastName: string; mobileNumber: string }[];
        meta_data: { firstName: string; lastName: string; mobileNumber: string };
      }[];
    }>({
      path: 'validUsers',
      select: '_id emails billingDetails meta_data',
    })
    .populate<{
      validServices: { _id: string; name: string; serviceType: string; description: string }[];
    }>({
      path: 'validServices',
      select: '_id name serviceType description',
    });

  return coupons.map(coupon => ({
    ...coupon,
    createdBy: coupon.createdBy?.emails?.[0],
    usedBy:
      coupon.usedBy?.map(user => ({
        _id: user._id,
        email: user.emails?.[0],
        name: user.meta_data?.firstName + ' ' + user.meta_data?.lastName,
        mobileNumber: user.meta_data?.mobileNumber || user.billingDetails?.[0]?.mobileNumber || '',
      })) || [],
    validUsers:
      coupon.validUsers?.map(user => ({
        _id: user._id,
        email: user.emails?.[0],
        name: `${user.meta_data?.firstName || ''} ${user.meta_data?.lastName || ''}`,
        mobileNumber: user.meta_data?.mobileNumber || user.billingDetails?.[0]?.mobileNumber || '',
      })) || [],
  }));
};

const deleteCouponFromDB = async (code: string) => {
  const coupon = await CouponModel.findOne({ code });

  if (!coupon) {
    throw new AppError(httpStatus.NOT_FOUND, 'Coupon not found');
  }

  if (coupon.redemptions > 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Cannot delete coupon that has been redeemed');
  }

  const result = await CouponModel.deleteOne({ code });
  return result;
};

const updateCouponByCode = async (code: string, updateData: Partial<ICoupon>) => {
  const existingCoupon = await CouponModel.findOne({ code });

  if (!existingCoupon) {
    throw new AppError(httpStatus.NOT_FOUND, 'Coupon not found');
  }

  const updatedCoupon = await CouponModel.findOneAndUpdate(
    { code },
    { $set: updateData },
    {
      new: true,
      lean: true,
      runValidators: true,
    }
  );

  return updatedCoupon;
};

export const CouponServices = {
  createCouponIntoDB,
  verifyCouponFromDB,
  getAllCouponsFromDB,
  deleteCouponFromDB,
  updateCouponByCode,
};
