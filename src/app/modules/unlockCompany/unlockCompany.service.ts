/* eslint-disable @typescript-eslint/no-explicit-any */
import { addYears, endOfDay, isAfter, isBefore } from 'date-fns';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../errors/AppError';
import { CompanyModel } from '../company/company.model';
import { BulkUnlockCreditModel } from '../credits/credit.model';
import { TCreditType } from '../credits/credits.interface';
import { UserModel } from '../user/user.model';
import { JobModel, UnlockedCompanyModel } from './unlockCompany.model';
import { createJobPayload } from './utils/createJobPayload';

const unlockCompanyWithCreditWhilePaymentVerification = async (
  userId: string,
  companyId: string,
  creditType: TCreditType,
  sessionUser: string,
  session: mongoose.ClientSession
) => {
  // const session = await mongoose.startSession();
  // session.startTransaction();

  try {
    const user = await UserModel.findById(userId).session(session);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    //check whether uId match with session user id
    if (user.uId !== sessionUser) {
      throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to access this resource');
    }

    // Check if the company is already unlocked
    const existingUnlock = await UnlockedCompanyModel.findOne({
      userId: user._id,
      companyId,
    }).session(session);

    // Fetch Company details
    const company = await CompanyModel.findOne({ cin: companyId }, { _id: 0, company: 1 })
      .session(session)
      .lean();

    if (!company) {
      throw new AppError(httpStatus.NOT_FOUND, 'Company data not available');
    }

    // let creditDeducted = false;

    if (!existingUnlock || existingUnlock.unlockType === 'documents') {
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

      // Create the unlocked company record with an expiry date of 1 year from now at 11:59 PM
      const expiryDate = endOfDay(addYears(new Date(), 1)); // Add 1 year and set to end of day

      // Use the credit
      userCredit.availableCredits -= 1;
      await userCredit.save({ session });
      // creditDeducted = true;

      // Create or update the unlocked company record
      if (existingUnlock) {
        existingUnlock.unlockType = 'report';
        existingUnlock.expiryDate = expiryDate;
        await existingUnlock.save({ session });
      } else {
        await UnlockedCompanyModel.create(
          [
            {
              userId: user._id,
              companyId,
              companyName: company.company,
              unlockType: 'report',
              expiryDate,
            },
          ],
          { session }
        );
      }
    }
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error; // Re-throw AppError instances
    }

    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  } finally {
    // await session.endSession();
  }
};

const unlockCompanyWithCredit = async (
  userId: string,
  companyId: string,
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

    // Check if the company is already unlocked
    const existingUnlock = await UnlockedCompanyModel.findOne({
      userId: user._id,
      companyId,
    }).session(session);

    // Fetch Company details
    const company = await CompanyModel.findOne({ cin: companyId }, { _id: 0, cin: 1, company: 1 })
      .session(session)
      .lean();

    if (!company) {
      throw new AppError(httpStatus.NOT_FOUND, 'Company data not available');
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

      // Create the unlocked company record with an expiry date of 1 year from now at 11:59 PM
      const expiryDate = endOfDay(addYears(new Date(), 1)); // Add 1 year and set to end of day

      // Use the credit
      userCredit.availableCredits -= 1;
      await userCredit.save({ session });
      creditDeducted = true;

      // Create the unlocked company record
      await UnlockedCompanyModel.create(
        [
          {
            userId: user._id,
            companyId,
            companyName: company.company,
            unlockType: 'report',
            expiryDate,
          },
        ],
        { session }
      );
    }

    // Get the updated credit information
    const updatedCredit = await BulkUnlockCreditModel.findOne({ userId: user._id, creditType });

    await session.commitTransaction();

    return {
      message: creditDeducted ? 'Company unlocked successfully' : 'Company already unlocked',
      alreadyUnlocked: !creditDeducted,
      ...company,
      remainingRedemptions: updatedCredit ? updatedCredit.availableCredits : 0,
      expiryDate: updatedCredit ? updatedCredit.expiryDate : new Date(),
    };
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

const getUserUnlockedCompany = async (_userId: string, sessionUser: string) => {
  const user = await UserModel.findById(_userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // check whether uId match with session user id
  if (user.uId !== sessionUser) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to access this resource');
  }

  const unlockedCompany = await UnlockedCompanyModel.find(
    { userId: _userId },
    {
      _id: 0,
      companyId: 1,
      companyName: 1,
      unlockType: 1,
      unlockedAt: 1,
      expiryDate: 1,
    }
  );

  return unlockedCompany;
};

const createVpdUnlockJobAndUnlockedCompany = async (
  userId: string,
  companyId: string,
  companyName: string,
  session: mongoose.ClientSession
) => {
  let job = null;

  // Check if company is already unlocked for this user
  const existingUnlock = await UnlockedCompanyModel.findOne({
    userId: userId,
    companyId: companyId,
  }).session(session);

  // Create or update unlocked company entry in the unlocked_companies collection
  const expiryDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
  let unlockedCompany;

  if (existingUnlock) {
    // Extend validity of existing unlock
    existingUnlock.expiryDate = expiryDate;
    await existingUnlock.save({ session });
    unlockedCompany = existingUnlock;
  } else {
    const unlockedCompanyPayload = {
      userId: userId,
      companyId: companyId,
      unlockType: 'documents',
      companyName: companyName,
      expiryDate: expiryDate, // 1 year from now
    };

    unlockedCompany = await UnlockedCompanyModel.create([unlockedCompanyPayload], {
      session,
    });
  }

  // Check if the companyId (CIN) is exactly 21 characters long
  const companyCINPattern = /^.{21}$/; // Matches any string with exactly 21 characters
  //find company incorporated date from company model
  const companyData = await CompanyModel.findOne(
    { cin: companyId },
    { _id: 0, 'masterData.companyData.incorporationDateObj': 1 }
  )
    .session(session)
    .lean();

  // if company incorporation date not found i still need to create the job and unlocked company as it might be some error need add the company based on the complain. cause sometime cin change
  // so we need to create the job and unlocked company even if the company incorporation date not found

  const V2_SKIP_CHALLAN_CUTOFF_DATE = new Date('2016-07-01');

  if (companyCINPattern.test(companyId)) {
    let jobPayload = null;

    // Safely extract incorporation date with optional chaining
    const incorporationDate = companyData?.masterData?.companyData?.incorporationDateObj;
    const isCompanyAfterJuly2016 =
      incorporationDate && isAfter(new Date(incorporationDate), V2_SKIP_CHALLAN_CUTOFF_DATE);

    if (isCompanyAfterJuly2016) {
      // create the job payload to skip v2 challan payment
      jobPayload = createJobPayload(
        companyId,
        companyName,
        userId,
        'challan_skipped',
        'challan_skipped'
      );
    } else {
      // Create the job in the job collection with v2 download as regular process
      // This handles: companyData not found, incorporation date missing, or company before July 2016
      jobPayload = createJobPayload(companyId, companyName, userId);
    }

    job = await JobModel.create([jobPayload], { session });
  }

  return { job, unlockedCompany };
};

// const getAllUnlockedCompanies = async () => {
//   const unlockedCompanies = await UnlockedCompanyModel.find({})
//     .select('-_id companyId companyName unlockType unlockedAt expiryDate')
//     .populate({
//       path: 'userId',
//       select: 'emails',
//     });
//   return unlockedCompanies;
// };

const getAllUnlockedCompanies = async (
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: 'asc' | 'desc',
  unlockType: 'all' | 'report' | 'documents',
  userEmail?: string,
  searchTerm?: string,
  startDate?: string,
  endDate?: string,
  companyType?: 'all' | 'llp' | 'company'
) => {
  const query: any = {};

  // Filter by user email if provided
  if (userEmail) {
    const user = await UserModel.findOne({ emails: userEmail });
    if (user) {
      query.userId = user._id; // Filter by user ID
    }
  }

  // Filter by search term (company ID or company name)
  if (searchTerm) {
    // Use the same CIN pattern as company service
    const cinPattern = /^(?:[A-Z]{1}[0-9A-Z]{20}|[A-Z]{3}-\d{1,4})$/;
    const isCINSearch = cinPattern.test(searchTerm.toLocaleUpperCase());

    if (isCINSearch) {
      // If it matches a CIN pattern, search by companyId
      query.companyId = searchTerm.toLocaleUpperCase();
    } else {
      // If it doesn't match a CIN pattern, search by companyName using regex
      query.companyName = { $regex: searchTerm, $options: 'i' }; // Case-insensitive search
    }
  }

  // Filter by unlockType if not 'all'
  if (unlockType !== 'all') {
    query.unlockType = unlockType; // Filter by unlockType
  }

  // Filter by date range if provided
  if (startDate || endDate) {
    query.unlockedAt = {};
    if (startDate) {
      query.unlockedAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.unlockedAt.$lte = new Date(endDate);
    }
  }

  // Filter by company type if not 'all'
  if (companyType && companyType !== 'all') {
    if (companyType === 'llp') {
      query.companyId = { $regex: /^[A-Z]{3}-\d{1,4}$/ }; // Pattern for LLP (e.g., ABA-2476)
    } else if (companyType === 'company') {
      query.companyId = { $regex: /^[A-Z][0-9A-Z]{20}$/ }; // Pattern for Company (e.g., U74140KL2015PTC037821)
    }
  }

  // Fetch total count of unlocked companies for pagination
  const totalCount = await UnlockedCompanyModel.countDocuments(query);

  const unlockedCompanies = await UnlockedCompanyModel.find(query)
    .select('-_id companyId companyName unlockType unlockedAt expiryDate')
    .populate({
      path: 'userId',
      select: 'emails',
    })
    .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 }) // Sort by specified field
    .skip((page - 1) * limit) // Pagination
    .limit(limit); // Limit results
  // Calculate total pages
  const totalPages = Math.ceil(totalCount / limit);
  return {
    unlockedCompanies,
    totalPages,
    totalCount,
    currentPage: page,
    limit,
  };
};

export const UnlockCompanyServices = {
  unlockCompanyWithCredit,
  unlockCompanyWithCreditWhilePaymentVerification,
  getUserUnlockedCompany,
  createVpdUnlockJobAndUnlockedCompany,
  getAllUnlockedCompanies,
};
