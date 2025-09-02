/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../errors/AppError';
import { IUser } from '../modules/user/user.interface';
import { UserModel } from '../modules/user/user.model';
import { getRolesForUser } from '../modules/user/utils/superTokenHelper';

const saveUserData = async (userData: any, rawUserInfo?: any, isVerified?: any) => {
  const emailVerified = rawUserInfo?.fromUserInfoAPI?.email_verified || isVerified || false;
  const newProfilePicture = rawUserInfo?.fromUserInfoAPI?.picture;
  const roles = await getRolesForUser(userData.id);

  // const { metadata } = await UserMetadata.getUserMetadata(userData.id);
  // console.log('meta Data from super token', metadata);

  try {
    // Fetch existing user data
    const existingUser = await UserModel.findOne({ uId: userData.id });

    // Use existing profile picture if no new one is provided
    const profilePicture =
      newProfilePicture !== undefined ? newProfilePicture : existingUser?.profilePicture || '';
    const meta_data = existingUser?.meta_data || {};
    // const bulk_unlock_credits = existingUser?.bulk_unlock_credits || [];

    const defaultBillingDetails = {
      firstName: meta_data.firstName || '',
      lastName: meta_data.lastName || '',
      email: userData.emails[0] || '',
      mobileNumber: meta_data.mobileNumber || userData.phoneNumbers[0] || '',
      isDefault: true,
      billingType: 'personal', // Default to personal
      zipCode: '', // These fields are required, so we'll set them to empty strings
      country: '',
      state: '',
    };

    const user: IUser = {
      uId: userData.id,
      meta_data: meta_data, //from super token
      timeJoined: userData.timeJoined,
      isPrimaryUser: userData.isPrimaryUser,
      tenantIds: userData.tenantIds,
      emails: userData.emails,
      phoneNumbers: userData.phoneNumbers,
      thirdParty: userData.thirdParty,
      loginMethods: userData.loginMethods.map((method: any) => ({
        recipeId: method.recipeId,
        tenantIds: method.tenantIds,
        timeJoined: method.timeJoined,
        recipeUserId: method.recipeUserId.getAsString(), // Adjust to extract the string value
        verified: method.verified,
        email: method.email,
        phoneNumber: method.phoneNumber,
        thirdParty: method.thirdParty,
      })),
      emailVerified: emailVerified,
      profilePicture: profilePicture,
      roles,
      billingDetails:
        existingUser?.billingDetails && existingUser?.billingDetails.length !== 0
          ? existingUser.billingDetails
          : [defaultBillingDetails],

      // bulk_unlock_credits: bulk_unlock_credits,
      lastLogin: new Date(),
    };

    // Update user information in MongoDB
    await UserModel.findOneAndUpdate({ uId: userData.id }, user, { upsert: true, new: true });
  } catch (error) {
    console.log(error);
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Error Saving user data in DB');
  }
};

export default saveUserData;
