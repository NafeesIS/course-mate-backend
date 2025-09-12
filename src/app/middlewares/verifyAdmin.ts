import { NextFunction, Response } from 'express';
import httpStatus from 'http-status';
import { SessionRequest } from 'supertokens-node/framework/express';
import AppError from '../errors/AppError';
import { UserModel } from '../modules/user/user.model';

export const verifyAdmin = async (req: SessionRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.session!.getUserId();
    const user = await UserModel.findOne({ uId: userId });

    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
    }

    if (!user.roles.includes('admin')) {
      throw new AppError(httpStatus.FORBIDDEN, 'Access denied. Admin role required.');
    }

    next();
  } catch (error) {
    next(error);
  }
};