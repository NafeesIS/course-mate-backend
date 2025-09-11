import { Request, Response } from "express";
import { SessionRequest } from "supertokens-node/framework/express";
import { UserModel } from "../user/user.model";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";

// Get current user info
export const getMe = catchAsync(async (req: SessionRequest, res: Response) => {
  const userId = req.session!.getUserId();

  const user = await UserModel.findOne({ supertokensId: userId });
  if (!user) {
    return res.status(404).json({ 
      success: false, 
      message: "User not found" 
    });
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
  const { firstName, lastName } = req.body;

  const user = await UserModel.findOneAndUpdate(
    { supertokensId: userId },
    { firstName, lastName },
    { new: true, runValidators: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

// Create user (fallback for manual user creation)
export const createUser = catchAsync(async (req: Request, res: Response) => {
  const { supertokensId, email, firstName, lastName, role } = req.body;

  if (!supertokensId || !email) {
    return res.status(400).json({
      success: false,
      message: "supertokensId and email are required",
    });
  }

  // Check if user already exists
  const existing = await UserModel.findOne({ supertokensId });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: "User already exists",
    });
  }

  const user = await UserModel.create({
    supertokensId,
    email,
    firstName,
    lastName,
    role: role || "user",
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User created successfully",
    data: user,
  });
});