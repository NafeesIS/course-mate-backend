/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import AppError from "../errors/AppError";
import { IUser } from "../modules/user/user.interface";
import { UserModel } from "../modules/user/user.model";
import { getRolesForUser } from "./superTokenHelper";

const saveUserData = async (
  userData: any,
  rawUserInfo?: any,
  isVerified?: any
) => {
  const emailVerified =
    rawUserInfo?.fromUserInfoAPI?.email_verified || isVerified || false;
  const newProfilePicture = rawUserInfo?.fromUserInfoAPI?.picture;
  //   const roles = await getRolesForUser(userData.id);

  try {
    // Fetch existing user data
    const existingUser = await UserModel.findOne({ uId: userData.id });

    // Use existing profile picture if no new one is provided
    const profilePicture =
      newProfilePicture !== undefined
        ? newProfilePicture
        : existingUser?.profilePicture || "";

    const meta_data = existingUser?.meta_data || {
      firstName: rawUserInfo?.fromUserInfoAPI?.given_name || "",
      lastName: rawUserInfo?.fromUserInfoAPI?.family_name || "",
      mobileNumber: userData.phoneNumbers?.[0] || "",
    };
    const roles = existingUser?.roles || (await getRolesForUser(userData.id));
    const user: Partial<IUser> = {
      uId: userData.id,
      meta_data: meta_data,
      timeJoined: userData.timeJoined,
      isPrimaryUser: userData.isPrimaryUser,
      tenantIds: userData.tenantIds,
      emails: userData.emails,
      phoneNumbers: userData.phoneNumbers,
      thirdParty: userData.thirdParty || [],
      loginMethods: userData.loginMethods.map((method: any) => ({
        recipeId: method.recipeId,
        tenantIds: method.tenantIds,
        timeJoined: method.timeJoined,
        recipeUserId: method.recipeUserId.getAsString(),
        verified: method.verified,
        email: method.email,
        phoneNumber: method.phoneNumber,
        thirdParty: method.thirdParty,
      })),
      emailVerified: emailVerified,
      profilePicture: profilePicture,
      roles,
      lastLogin: new Date(),
    };

    // Update user information in MongoDB
    const savedUser = await UserModel.findOneAndUpdate(
      { uId: userData.id },
      user,
      { upsert: true, new: true, runValidators: true }
    );

    return savedUser;
  } catch (error) {
    console.log("Error saving user data:", error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Error saving user data in DB"
    );
  }
};

export default saveUserData;
