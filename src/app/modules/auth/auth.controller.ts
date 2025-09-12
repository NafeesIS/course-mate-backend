import { Request, Response } from "express";
import { SessionRequest } from "supertokens-node/framework/express";
import { UserModel } from "../user/user.model";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";

// Get current user info
export const getMe = catchAsync(async (req: SessionRequest, res: Response) => {
  const userId = req.session!.getUserId();

  const user = await UserModel.findOne({ uId: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User retrieved successfully",
    data: user,
  });
});

// Update user profile
export const updateProfile = catchAsync(async (req: SessionRequest, res: Response) => {
  const userId = req.session!.getUserId();
  const { firstName, lastName, mobileNumber } = req.body;

  const user = await UserModel.findOne({ uId: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Update meta_data
  const updatedMetaData = {
    ...user.meta_data,
    firstName: firstName || user.meta_data.firstName,
    lastName: lastName || user.meta_data.lastName,
    mobileNumber: mobileNumber || user.meta_data.mobileNumber,
  };

  const updatedUser = await UserModel.findOneAndUpdate(
    { uId: userId },
    { 
      meta_data: updatedMetaData,
      lastLogin: new Date()
    },
    { new: true, runValidators: true }
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: updatedUser,
  });
});

// Create user (fallback for manual user creation)
export const createUser = catchAsync(async (req: Request, res: Response) => {
  const { uId, email, firstName, lastName, role } = req.body;

  if (!uId || !email) {
    throw new AppError(httpStatus.BAD_REQUEST, "uId and email are required");
  }

  // Check if user already exists
  const existing = await UserModel.findOne({ uId });
  if (existing) {
    throw new AppError(httpStatus.BAD_REQUEST, "User already exists");
  }

  const defaultBillingDetails = {
    firstName: firstName || '',
    lastName: lastName || '',
    email: email,
    mobileNumber: '',
    isDefault: true,
    billingType: 'personal' as const,
    zipCode: '',
    country: '',
    state: '',
  };

  const user = await UserModel.create({
    uId,
    emails: [email],
    meta_data: {
      firstName: firstName || '',
      lastName: lastName || '',
      mobileNumber: '',
    },
    timeJoined: Date.now(),
    isPrimaryUser: true,
    tenantIds: ['public'],
    phoneNumbers: [],
    thirdParty: [],
    loginMethods: [],
    emailVerified: false,
    roles: [role || "user"],
    billingDetails: [defaultBillingDetails],
    lastLogin: new Date(),
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User created successfully",
    data: user,
  });
});

// Get all users (admin only)
export const getAllUsers = catchAsync(async (req: SessionRequest, res: Response) => {
  const userId = req.session!.getUserId();
  
  // Check if user is admin
  const currentUser = await UserModel.findOne({ uId: userId });
  if (!currentUser || !currentUser.roles.includes('admin')) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied. Admin role required");
  }

  const users = await UserModel.find().sort({ lastLogin: -1 });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users retrieved successfully",
    data: users,
  });
});