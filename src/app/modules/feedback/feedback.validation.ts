import { z } from 'zod';

export const feedbackValidationSchema = z.object({
  body: z.object({
    overall: z.number().min(1).max(5, 'Overall rating must be between 1 and 5'),
    website: z.number().min(1).max(5, 'Website rating must be between 1 and 5'),
    recommend: z.number().min(1).max(5, 'Recommendation rating must be between 1 and 5'),
    support: z.number().min(1).max(5, 'Support rating must be between 1 and 5'),
    feedback: z.string().max(1000, 'Feedback is too long').optional(),
    userEmail: z.string().email('Invalid email format').optional(),
    recaptchaToken: z.string({
      required_error: 'reCAPTCHA token is required',
      invalid_type_error: 'reCAPTCHA token must be a string',
    }),
  }),
});
