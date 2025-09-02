/* eslint-disable @typescript-eslint/no-explicit-any */
import { isBefore } from 'date-fns';
import httpStatus from 'http-status';
import mongoose, { PipelineStage } from 'mongoose';
import AppError from '../../errors/AppError';
import { BulkUnlockCreditModel } from '../credits/credit.model';
import { TCreditType } from '../credits/credits.interface';
import { DirectorModel } from '../director/director.model';
import { UserModel } from '../user/user.model';
import { UnlockedContactModel } from './unlockContact.model';

const unlockContactWithCredit = async (
  userId: string,
  directorId: string,
  creditType: TCreditType,
  sessionUser: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await UserModel.findById(userId).session(session);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    //check whether uId match with session user id
    if (user.uId !== sessionUser) {
      throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to access this resource');
    }

    // Check if the contact is already unlocked
    const existingUnlock = await UnlockedContactModel.findOne({
      userId: user._id,
      directorId,
    }).session(session);

    // Fetch director details
    const director = await DirectorModel.findOne(
      { din: directorId },
      { _id: 0, mobileNumber: 1, emailAddress: 1, fullName: 1 }
    )
      .session(session)
      .lean();

    if (!director) {
      throw new AppError(httpStatus.NOT_FOUND, 'Director data not available');
    }

    let creditDeducted = false;

    if (!existingUnlock) {
      // Check if user has enough valid credits
      const userCredit = await BulkUnlockCreditModel.findOne({
        userId: user._id,
        creditType,
      }).session(session);
      if (!userCredit) {
        throw new AppError(httpStatus.BAD_REQUEST, 'No credit found for this user');
      }
      if (userCredit.availableCredits < 1) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Insufficient credits');
      }
      if (isBefore(userCredit.expiryDate, new Date())) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'Credit expired, please buy new credit to increase validity'
        );
      }

      // Use the credit
      userCredit.availableCredits -= 1;
      await userCredit.save({ session });
      creditDeducted = true;

      // Create the unlocked contact record
      await UnlockedContactModel.create(
        [
          {
            userId: user._id,
            directorId,
          },
        ],
        { session }
      );
    }

    // Get the updated credit information
    const updatedCredit = await BulkUnlockCreditModel.findOne({ userId: user._id, creditType });

    await session.commitTransaction();

    // console.log('----------', updatedCredit);

    return {
      message: creditDeducted
        ? 'Director contact unlocked successfully'
        : 'Contact already unlocked',
      alreadyUnlocked: !creditDeducted,
      ...director,
      remainingRedemptions: updatedCredit ? updatedCredit.availableCredits : 0,
      expiryDate: updatedCredit ? updatedCredit.expiryDate : new Date(),
    };

    // if (existingUnlock) {
    //   await session.abortTransaction();
    //   return { message: 'Contact already unlocked', alreadyUnlocked: true };
    // }

    // // Check if user has enough valid credits
    // const userCredit = await BulkUnlockCreditModel.findOne({ userId: user._id }).session(session);
    // if (
    //   !userCredit ||
    //   userCredit.availableCredits < 1 ||
    //   isBefore(userCredit.expiryDate, new Date())
    // ) {
    //   throw new AppError(httpStatus.BAD_REQUEST, 'Insufficient or expired credits');
    // }

    // // Use the credit
    // userCredit.availableCredits -= 1;
    // await userCredit.save({ session });

    // // Create the unlocked contact record
    // await UnlockedContactModel.create(
    //   [
    //     {
    //       userId: user._id,
    //       directorId,
    //     },
    //   ],
    //   { session }
    // );

    // await session.commitTransaction();
    // return { message: 'Director contact unlocked successfully', alreadyUnlocked: false };
  } catch (error: any) {
    await session.abortTransaction();
    if (error instanceof AppError) {
      throw error; // Re-throw AppError instances
    }

    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  } finally {
    await session.endSession();
  }
};

const getUserUnlockedContacts = async (
  _userId: string,
  page: number,
  limit = 20,
  sessionUser: string,
  sortBy = 'unlockedAt',
  order = 'desc',
  search = ''
) => {
  const user = await UserModel.findById(_userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  //check whether uId match with session user id
  if (user.uId !== sessionUser) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to access this resource');
  }

  const skip = (page - 1) * limit;
  const sortOrder = order === 'desc' ? -1 : 1;

  // Build the match stage for search
  const searchMatch = search
    ? {
        $or: [
          { 'directorDetails.fullName': { $regex: search, $options: 'i' } },
          { 'directorDetails.din': { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const pipeline: PipelineStage[] = [
    { $match: { userId: new mongoose.Types.ObjectId(_userId) } },
    {
      $lookup: {
        from: 'director_data',
        localField: 'directorId',
        foreignField: 'din',
        as: 'directorDetails',
      },
    },
    { $unwind: '$directorDetails' },
    { $match: searchMatch },
    { $sort: { [sortBy]: sortOrder } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        directorId: 1,
        unlockedAt: 1,
        mobileNumber: '$directorDetails.mobileNumber',
        emailAddress: '$directorDetails.emailAddress',
        fullName: '$directorDetails.fullName',
      },
    },
  ];

  const unlockedContacts = await UnlockedContactModel.aggregate(pipeline);

  // Get total count with search filter
  const countPipeline: PipelineStage[] = [
    { $match: { userId: new mongoose.Types.ObjectId(_userId) } },
    {
      $lookup: {
        from: 'director_data',
        localField: 'directorId',
        foreignField: 'din',
        as: 'directorDetails',
      },
    },
    { $unwind: '$directorDetails' },
    { $match: searchMatch },
    { $count: 'total' },
  ];

  const countResult = await UnlockedContactModel.aggregate(countPipeline);
  const totalCount = countResult[0]?.total || 0;

  return {
    unlockedContacts,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalItems: totalCount,
      itemsPerPage: limit,
    },
  };
};

// const getUserUnlockedContacts = async (_userId: string) => {
//   // const user = await UserModel.findById(_userId);
//   // if (!user) {
//   //   throw new AppError(httpStatus.NOT_FOUND, 'User not found');
//   // }

//   // const userCredit = await BulkUnlockCreditModel.findOne({ userId: _userId });

//   const unlockedContacts = await UnlockedContactModel.find(
//     { userId: _userId },
//     { directorId: 1, unlockedAt: 1, _id: 0 }
//   ).lean();

//   const directorDetails = await Promise.all(
//     unlockedContacts.map(async contact => {
//       const director = await DirectorModel.findOne(
//         { din: contact.directorId },
//         { _id: 0, mobileNumber: 1, emailAddress: 1, fullName: 1 }
//       ).lean();

//       return {
//         ...director,
//         ...contact,
//         // directorDetails: director || null,
//       };
//     })
//   );

//   return directorDetails
//   // return {
//   //   // availableCredits: userCredit?.availableCredits,
//   //   // creditsExpiryDate: userCredit?.expiryDate,
//   //   // unlockedContacts: directorDetails,
//   //   directorDetails
//   // };
// };

export const UnlockContactServices = {
  unlockContactWithCredit,
  getUserUnlockedContacts,
};
