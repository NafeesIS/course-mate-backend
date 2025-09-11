import { Request, Response } from "express";
import { SessionRequest } from "supertokens-node/framework/express";
import { UserModel } from "../user/user.model";

// Example protected route
export const getMe = async (req: SessionRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();

    const user = await UserModel.findOne({ supertokensId: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
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

    const user = new UserModel({
      supertokensId,
      email,
      firstName,
      lastName,
      role: role || "user",
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};