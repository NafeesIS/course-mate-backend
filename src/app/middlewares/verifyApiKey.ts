// import { NextFunction, Request, Response } from 'express';
// import httpStatus from 'http-status';
// import { RateLimiterMemory } from 'rate-limiter-flexible';
// import AppError from '../errors/AppError';
// import { ApiKeyServices } from '../modules/apiKey/apiKey.service';

// // Create rate limiter instance
// const rateLimiter = new RateLimiterMemory({
//   points: 60, // Number of points
//   duration: 60, // Per 60 seconds
// });

// export const verifyApiKey = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const apiKey = req.headers['x-api-key'] as string;

//     if (!apiKey) {
//       throw new AppError(httpStatus.UNAUTHORIZED, 'API key is required');
//     }

//     // Find and validate API key
//     const apiKeyDoc = await ApiKeyServices.getApiKeyUsageFromDB(apiKey);

//     if (!apiKeyDoc) {
//       throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid API key');
//     }

//     if (!apiKeyDoc.isActive) {
//       throw new AppError(httpStatus.UNAUTHORIZED, 'API key is inactive');
//     }

//     // Check rate limit
//     try {
//       await rateLimiter.consume(apiKey);
//     } catch (error) {
//       throw new AppError(httpStatus.TOO_MANY_REQUESTS, 'Rate limit exceeded');
//     }

//     // Update usage statistics
//     const updatedApiKey = await ApiKeyServices.updateApiKeyUsageIntoDB(apiKey);

//     if (!updatedApiKey) {
//       throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update API key usage');
//     }

//     // Attach API key info to request for later use
//     req.apiKey = updatedApiKey;

//     next();
//   } catch (error) {
//     next(error);
//   }
// };
