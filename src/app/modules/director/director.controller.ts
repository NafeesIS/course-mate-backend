/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { DirectorServices } from './director.service';

const getDirectorSuggestions: RequestHandler = catchAsync(async (req, res) => {
  let searchTerm = req.query.searchTerm;

  // Validate the search term is a string and not empty
  if (typeof searchTerm !== 'string' || !searchTerm.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Valid search term is required.');
  }

  //standardize the search term
  searchTerm = searchTerm.trim().toUpperCase();

  const result = await DirectorServices.getDirectorSuggestionsFromDB(req.query);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Director suggestions fetched successfully.',
    data: result,
  });
});

const getDirectorAdvanceSearch: RequestHandler = catchAsync(async (req, res) => {
  const formattedQuery: Record<string, unknown> = Object.keys(req.query).reduce<
    Record<string, unknown>
  >((acc, key) => {
    let value = req.query[key];
    // If the value is a string containing commas, split it into an array
    if (typeof value === 'string') {
      // If value contains commas, split it into an array, otherwise keep it as is
      value = value.includes(',') ? value.split(',') : value;
    }
    // Store the formatted data
    acc[key] = value;

    return acc;
  }, {});

  const result = await DirectorServices.getDirectorAdvanceSearchFromDB(formattedQuery);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Director advance suggestions fetched successfully.',
    data: result,
  });
});

const getDirectorAdvanceSearchFacets: RequestHandler = catchAsync(async (req, res) => {
  const result = await DirectorServices.getCompanyAdvanceSearchFacetsFromDB(req.query);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Director advance search fetched successfully.',
    data: result,
  });
});

const getSingleDirectorDetails: RequestHandler = catchAsync(async (req, res) => {
  const result = await DirectorServices.getSingleDirectorDetailsFromDB(req.query);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Director details fetched successfully.',
    data: result,
  });
});

// New controller function for associated directors
const getAssociatedDirectors: RequestHandler = catchAsync(async (req, res) => {
  const result = await DirectorServices.getAssociatedDirectorsFromDB(req.query);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Associated directors fetched successfully.',
    data: result,
  });
});

const checkContactStatus: RequestHandler = catchAsync(async (req, res) => {
  const { din } = req.query;
  if (!din) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }
  const result = await DirectorServices.checkContactStatusFromDB(req.query);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contact status fetched successfully.',
    data: result,
  });
});

const getPaidContactDetails: RequestHandler = catchAsync(async (req, res) => {
  const { din } = req.query;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const {
    isPaymentVerified,
    verifiedServiceId,
    remainingRedemptions,
    maxRedemptions,
    customerEmail,
    customerPhone,
    amount,
    currency,
    orderId,
  } = req as any;

  if (!din) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }
  const result = await DirectorServices.getPaidContactDetailsFromDB(
    din as string,
    isPaymentVerified,
    verifiedServiceId,
    remainingRedemptions,
    maxRedemptions,
    customerEmail,
    customerPhone,
    amount,
    currency,
    orderId
  );

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result?.message || 'Contact status fetched successfully.',
    data: result.data,
  });
});

const triggerContactUpdater: RequestHandler = catchAsync(async (req, res) => {
  const { din } = req.query;
  if (!din) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }
  const result = await DirectorServices.createDirectorMasterDataUpdateRequest(din as string);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result,
    data: null,
  });
});

const hideContactInfo: RequestHandler = catchAsync(async (req, res) => {
  const { din } = req.body;

  // Enhanced validation with type checking and trimming
  if (!din || typeof din !== 'string' || !din.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Valid DIN is required');
  }

  const trimmedDIN = din.trim();
  const result = await DirectorServices.hideContactInfoByDIN(trimmedDIN);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

const showContactInfo: RequestHandler = catchAsync(async (req, res) => {
  const { din } = req.body;

  // Enhanced validation with type checking and trimming
  if (!din || typeof din !== 'string' || !din.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Valid DIN is required');
  }

  const trimmedDIN = din.trim();
  const result = await DirectorServices.showContactInfoByDIN(trimmedDIN);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

const getDirectorContactInfoStatus: RequestHandler = catchAsync(async (req, res) => {
  const { din } = req.query;

  // Enhanced validation with type checking and trimming
  if (!din || typeof din !== 'string' || !din.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Valid DIN is required');
  }

  const trimmedDIN = din.trim();
  const result = await DirectorServices.getDirectorContactInfoStatusByDIN(trimmedDIN);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

const getDirectorContactDetails: RequestHandler = catchAsync(async (req, res) => {
  const { din } = req.query;
  if (!din) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }
  const result = await DirectorServices.getDirectorContactDetailsFromDB(din as string);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

export const DirectorControllers = {
  getDirectorSuggestions,
  getDirectorAdvanceSearch,
  getDirectorAdvanceSearchFacets,
  getSingleDirectorDetails,
  getAssociatedDirectors,
  checkContactStatus,
  getPaidContactDetails,
  triggerContactUpdater,
  hideContactInfo,
  showContactInfo,
  getDirectorContactInfoStatus,
  getDirectorContactDetails,
};
