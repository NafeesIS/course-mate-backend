import mongoose from 'mongoose';
import { z } from 'zod';
import { subscriptionPlan } from './subscription.constant';

const createSubscriptionValidationSchema = z.object({
  body: z.object({
    userId: z.string(), // Validate as a UUID string
    serviceId: z.string(), // Validate as a UUID string
    plan: z.enum([...subscriptionPlan] as [string, ...string[]]), // Validate selectedPlan as one of the allowed values
    options: z.array(z.string()), // Validate as an array of strings
  }),
});

// Validation for getting user subscription details by IDs
const objectIdSchema = z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

// Schema to get subscriptions by IDs
const getUserSubscriptionsByIdsSchema = z.object({
  body: z.object({
    subscriptionIds: z.array(objectIdSchema).nonempty('subscriptionIds array is required'),
  }),
});

// Validation for getting email history by user ID and optional filters
const getEmailHistoryByUserIdSchema = z.object({
  query: z.object({
    userId: objectIdSchema,
    page: z
      .string()
      .optional()
      .refine(val => !val || /^\d+$/.test(val), { message: 'Page must be a number' }),
    limit: z
      .string()
      .optional()
      .refine(val => !val || /^\d+$/.test(val), { message: 'Limit must be a number' }),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    processDate: z.string().datetime({ offset: true }).optional(),
    processEndDate: z.string().datetime({ offset: true }).optional(),
    emailSentDate: z.string().datetime({ offset: true }).optional(),
    emailSentEndDate: z.string().datetime({ offset: true }).optional(),
  }),
});

const getEmailHistoryMetricsSchema = z.object({
  query: z.object({
    userId: objectIdSchema,
  }),
});

export const SubscriptionValidations = {
  createSubscriptionValidationSchema,
  getUserSubscriptionsByIdsSchema,
  getEmailHistoryByUserIdSchema,
  getEmailHistoryMetricsSchema,
};
