// import { NextFunction, Response } from 'express';
// import httpStatus from 'http-status';
// import { SessionRequest } from 'supertokens-node/lib/build/framework/fastify';
// import AppError from '../errors/AppError';
// import { UserModel } from '../modules/user/user.model';

// export const verifyAdmin = async (req: SessionRequest, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.session!.getUserId();
//     const user = await UserModel.findOne({ uId: userId });

//     if (!user) {
//       throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
//     }

//     if (!user.roles.includes('admin')) {
//       // Check if 'admin' is in the roles array
//       throw new AppError(httpStatus.FORBIDDEN, 'Access denied');
//     }

//     next();
//   } catch (error) {
//     next(error);
//   }
// };
