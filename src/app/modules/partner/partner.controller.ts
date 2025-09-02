import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PartnerServices } from './partner.service';
const getAllPartner = catchAsync(async (req, res) => {
  const result = await PartnerServices.getAllPartnerFromDB();

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Company Data Update Status fetched  successfully.',
    data: result,
  });
});

const getSinglePartner = catchAsync(async (req, res) => {
  if (!req.query?.partnerId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }
  const result = await PartnerServices.getSinglePartnerFromDB(req.query);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Company Data Update Status fetched  successfully.',
    data: result,
  });
});

export const PartnerControllers = {
  getSinglePartner,
  getAllPartner,
};
