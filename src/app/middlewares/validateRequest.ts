import { NextFunction, Request, Response } from 'express';
import { ZodObject, ZodRawShape } from 'zod'; // Import ZodObject and ZodRawShape

const validateRequest = (schema: ZodObject<ZodRawShape>) => { // Accepts object schemas
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // validation
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      return next();
    } catch (err) {
      next(err);
    }
  };
};

export default validateRequest;
