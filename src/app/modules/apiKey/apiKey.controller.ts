import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ApiKeyServices } from './apiKey.service';

const generateApiKey: RequestHandler = catchAsync(async (req, res) => {
  const { name, email, company, rateLimit } = req.body;

  const newApiKey = await ApiKeyServices.generateApiKeyIntoDB({
    name,
    email,
    company,
    rateLimit,
  });

  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'API key generated successfully',
    data: {
      apiKey: newApiKey.key,
      name: newApiKey.name,
      email: newApiKey.email,
      company: newApiKey.company,
      rateLimit: newApiKey.rateLimit,
    },
  });
});

const getApiKeyUsage: RequestHandler = catchAsync(async (req, res) => {
  const { key } = req.query;

  const apiKey = await ApiKeyServices.getApiKeyUsageFromDB(key as string);

  if (!apiKey) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'API key not found',
      data: null,
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'API key usage retrieved successfully',
    data: {
      name: apiKey.name,
      email: apiKey.email,
      company: apiKey.company,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt,
      lastUsed: apiKey.lastUsed,
      usageCount: apiKey.usageCount,
      rateLimit: apiKey.rateLimit,
    },
  });
});

const deactivateApiKey: RequestHandler = catchAsync(async (req, res) => {
  const { key } = req.body;

  await ApiKeyServices.deactivateApiKeyIntoDB(key);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'API key deactivated successfully',
    data: null,
  });
});

export const ApiKeyControllers = {
  generateApiKey,
  getApiKeyUsage,
  deactivateApiKey,
};
