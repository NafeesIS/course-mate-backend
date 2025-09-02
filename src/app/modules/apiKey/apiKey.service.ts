import httpStatus from 'http-status';
import { v4 as uuidv4 } from 'uuid';
import AppError from '../../errors/AppError';
import { ApiKeyModel, IApiKey } from './apiKey.model';

const generateApiKeyIntoDB = async (payload: {
  name: string;
  email: string;
  company: string;
  rateLimit?: number;
}): Promise<IApiKey> => {
  const { name, email, company, rateLimit } = payload;

  if (!name || !email || !company) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Name, email, and company are required');
  }

  const apiKey = uuidv4();

  const newApiKey = await ApiKeyModel.create({
    key: apiKey,
    name,
    email,
    company,
    rateLimit: rateLimit || 60,
  });

  return newApiKey;
};

const getApiKeyUsageFromDB = async (key: string): Promise<IApiKey | null> => {
  if (!key) {
    throw new AppError(httpStatus.BAD_REQUEST, 'API key is required');
  }

  const apiKey = await ApiKeyModel.findOne({ key });

  if (!apiKey) {
    throw new AppError(httpStatus.NOT_FOUND, 'API key not found');
  }

  return apiKey;
};

const deactivateApiKeyIntoDB = async (key: string): Promise<IApiKey | null> => {
  if (!key) {
    throw new AppError(httpStatus.BAD_REQUEST, 'API key is required');
  }

  const apiKey = await ApiKeyModel.findOne({ key });

  if (!apiKey) {
    throw new AppError(httpStatus.NOT_FOUND, 'API key not found');
  }

  apiKey.isActive = false;
  await apiKey.save();

  return apiKey;
};

const updateApiKeyUsageIntoDB = async (key: string): Promise<IApiKey | null> => {
  const apiKey = await ApiKeyModel.findOne({ key });

  if (!apiKey) {
    return null;
  }

  apiKey.usageCount += 1;
  apiKey.lastUsed = new Date();
  await apiKey.save();

  return apiKey;
};

export const ApiKeyServices = {
  generateApiKeyIntoDB,
  getApiKeyUsageFromDB,
  deactivateApiKeyIntoDB,
  updateApiKeyUsageIntoDB,
};
