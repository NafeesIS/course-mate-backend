import { z } from 'zod';

export const createCouponValidationSchema = z.object({
  body: z.object({
    code: z.string().optional(),
    type: z.enum(['percentage', 'flat'], {
      errorMap: () => ({ message: 'Invalid coupon type' }),
    }),
    value: z
      .number({
        invalid_type_error: 'Value must be a number',
      })
      .positive({ message: 'Value must be a positive number' }),
    expiryDate: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid expiry date'),
    maxRedemptions: z.number().int().positive('Max redemptions must be a positive integer'),
    maxRedemptionsPerUser: z.number().int().positive().optional(),
    redemptions: z.number().int().nonnegative().default(0),
    usedBy: z.array(z.string().regex(/^[a-f\d]{24}$/i)).optional(), // Valid MongoDB ObjectId
    isActive: z.boolean().default(true),
    minimumOrderValue: z.number().positive().optional(),
    isFirstTimeUser: z.boolean().default(false),
    validServices: z
      .array(z.string().regex(/^[a-f\d]{24}$/i), {
        invalid_type_error: 'Invalid service ID',
      })
      .optional(),
    validUsers: z
      .array(z.string().regex(/^[a-f\d]{24}$/i), {
        invalid_type_error: 'Invalid user ID',
      })
      .optional(),
    createdBy: z.string().regex(/^[a-f\d]{24}$/i),
    isStackable: z.boolean().default(true),
  }),
});

export const updateCouponValidationSchema = z.object({
  body: z
    .object({
      expiryDate: z.string().datetime({ message: 'Invalid expiry date' }).optional(),

      maxRedemptions: z
        .number()
        .int('Must be a whole number')
        .positive('Must be greater than 0')
        .optional(),

      maxRedemptionsPerUser: z
        .number()
        .int('Must be a whole number')
        .positive('Must be greater than 0')
        .optional(),

      isActive: z.boolean().optional(),

      minimumOrderValue: z.number().positive('Must be greater than 0').optional(),

      isFirstTimeUser: z.boolean().optional(),

      validServices: z
        .array(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid service ID format'))
        .optional(),

      validUsers: z.array(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user ID format')).optional(),

      isStackable: z.boolean().optional(),
    })
    .strict(),
});
