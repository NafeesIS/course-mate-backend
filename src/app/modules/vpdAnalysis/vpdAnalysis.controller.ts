import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { decryptReqData, generateEncryptedReqData } from './utils/generateDownloadLink';
import { VpdAnalysisServices } from './vpdAnalysis.service';

const createDownloadLinkForSingleVpd: RequestHandler = catchAsync(async (req, res) => {
  const isVerifiedUser = req.query?.pass === 'tushar';
  if (!isVerifiedUser) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized User');
  }
  const { documentCode, formId, fileName, dateOfFiling } = req.query;
  if (!documentCode || !formId || !fileName || !dateOfFiling) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }
  const result = await VpdAnalysisServices.generateDownloadLinkForSingleVpd({
    documentCode: Number(documentCode),
    formId: formId as string,
    fileName: fileName as string,
    dateOfFiling: dateOfFiling as string,
  });
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Download link generated successfully',
    data: result,
  });
});

const createDownloadLinkForSingleLLP: RequestHandler = catchAsync(async (req, res) => {
  const isVerifiedUser = req.query?.pass === 'tushar';
  if (!isVerifiedUser) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized User');
  }
  const result = await VpdAnalysisServices.createDownloadLinkForSingleLLPIntoDB(req.query);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: [],
  });
});

const generateAuthTokenMCA: RequestHandler = catchAsync(async (req, res) => {
  const result = await VpdAnalysisServices.generateAuthTokenIntoDB();
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Auth token generated and saved successfully',
    data: result,
  });
});

const generateAuthTokenGST: RequestHandler = catchAsync(async (req, res) => {
  const result = await VpdAnalysisServices.generateGSTAuthTokenIntoDB();
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'GST Auth token generated and saved successfully',
    data: result,
  });
});

const getEncryptedVpdDataReqUrl: RequestHandler = catchAsync(async (req, res) => {
  if (!req.query.data) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }
  const { data } = req.query;
  const result = generateEncryptedReqData(data as string);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vpd data encrypted url generated successfully',
    data: result,
  });
});

const getDecryptedData: RequestHandler = catchAsync(async (req, res) => {
  if (!req.query.data) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }
  const { data } = req.query;
  const result = decryptReqData(data as string);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Requested data decrypted successfully',
    data: result,
  });
});

// const solveMCACaptcha: RequestHandler = catchAsync(async (req, res) => {
//   const result = await solveMCACaptcha();
//   return sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Captcha solved successfully',
//     data: result,
//   });
// });

export const vpdAnalysisControllers = {
  createDownloadLinkForSingleVpd,
  createDownloadLinkForSingleLLP,
  generateAuthTokenMCA,
  generateAuthTokenGST,
  getEncryptedVpdDataReqUrl,
  getDecryptedData,
};
