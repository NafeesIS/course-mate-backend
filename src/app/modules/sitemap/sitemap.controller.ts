import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { SitemapServices } from './sitemap.service';

const getAllCompany = catchAsync(async (req, res) => {
  const result = await SitemapServices.getAllCompanyCINFromDB(req.query);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Company Data Update Status fetched  successfully.',
    data: result,
  });
});
const getTotalCompanyCount = catchAsync(async (req, res) => {
  const result = await SitemapServices.getTotalCompanyCountFromDB();

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Company Data Update Status fetched  successfully.',
    data: result,
  });
});

export const SitemapControllers = {
  getAllCompany,
  getTotalCompanyCount,
};
