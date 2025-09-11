import { Request, Response } from "express";
import { UserModel } from "../user/user.model";

// Example protected route
export const getMe = async (req: Request, res: Response) => {
  try {
    // @ts-ignore (added by Supertokens middleware)
    const userId = req.session!.getUserId();

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
