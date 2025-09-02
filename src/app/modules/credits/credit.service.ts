import { addDays, isAfter } from 'date-fns';
import httpStatus from 'http-status';
import { ClientSession } from 'mongoose';
import AppError from '../../errors/AppError';
import { UserModel } from '../user/user.model';
import { BulkUnlockCreditModel } from './credit.model';
import { TCreditType } from './credits.interface';

const addUnlockCreditIntoDB = async (
  userId: string,
  credits: number,
  expiryDays: number,
  creditType: TCreditType,
  session: ClientSession
) => {
  const user = await UserModel.findById(userId).session(session); //finding user with _id
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const now = new Date();
  const expiryDate = addDays(now, expiryDays); // Adding validityDays to current date

  let userCredit = await BulkUnlockCreditModel.findOne({
    userId: user._id,
    creditType,
  }).session(session);

  if (userCredit) {
    // Add new credits to the existing credits, whether expired or not
    userCredit.availableCredits += credits;

    // Extend the validity to the new date if the existing credit has expired or if the new validity is greater
    userCredit.expiryDate = isAfter(expiryDate, userCredit.expiryDate)
      ? expiryDate
      : userCredit.expiryDate;

    await userCredit.save({ session });
  } else {
    // Create a new credit record if none exists

    userCredit = new BulkUnlockCreditModel({
      userId: user._id,
      availableCredits: credits,
      expiryDate: expiryDate,
      creditType,
    });
  }

  const savedCredit = await userCredit.save({ session });

  // Add the new or updated credit to the user's credits array if it's not already there
  if (!user.bulk_unlock_credits?.includes(savedCredit._id)) {
    user.bulk_unlock_credits?.push(savedCredit._id);
    await user.save({ session });
  }

  return savedCredit;
};

const addBulkUnlockCreditIntoDBWithoutSession = async (
  userId: string,
  credits: number,
  expiryDays: number,
  creditType: TCreditType
) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const now = new Date();
  const expiryDate = addDays(now, expiryDays);

  let userCredit = await BulkUnlockCreditModel.findOne({ userId: user._id });

  if (userCredit) {
    userCredit.availableCredits += credits;
    userCredit.expiryDate = isAfter(expiryDate, userCredit.expiryDate)
      ? expiryDate
      : userCredit.expiryDate;
  } else {
    userCredit = new BulkUnlockCreditModel({
      userId: user._id,
      availableCredits: credits,
      expiryDate: expiryDate,
      creditType,
    });
  }

  await userCredit.save();

  if (!user.bulk_unlock_credits?.includes(userCredit._id)) {
    user.bulk_unlock_credits = user.bulk_unlock_credits || [];
    user.bulk_unlock_credits.push(userCredit._id);
    await user.save();
  }

  return userCredit;
};

export const CreditServices = {
  addUnlockCreditIntoDB,
  addBulkUnlockCreditIntoDBWithoutSession,
};
