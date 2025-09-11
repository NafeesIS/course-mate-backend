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