import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { RecentSearchDTO } from './insights.interface';
import { InsightsServices } from './insights.service';

const createRecentSearches: RequestHandler = catchAsync(async (req, res) => {
  const searchData: RecentSearchDTO = req.body;
  const result = await InsightsServices.createRecentSearchesIntoDB(searchData);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Recent search created successfully.',
    data: result,
  });
});

const getRecentSearches: RequestHandler = catchAsync(async (req, res) => {
  const result = await InsightsServices.getRecentSearchesFromDB();
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Recent searches fetched successfully.',
    data: result,
  });
});

const getPopularSearches: RequestHandler = catchAsync(async (req, res) => {
  const result = await InsightsServices.getPopularSearchesFromDB();
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Popular searches fetched successfully.',
    data: result,
  });
});

const getRecentlyIncorporatedCompanies: RequestHandler = catchAsync(async (req, res) => {
  const result = await InsightsServices.getRecentlyIncorporatedCompaniesFromDB();
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Recently incorporated companies fetched successfully.',
    data: result,
  });
});

export const InsightsControllers = {
  createRecentSearches,
  getRecentSearches,
  getPopularSearches,
  getRecentlyIncorporatedCompanies,
};
