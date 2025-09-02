import { z } from 'zod';

// Zod schema for Mailchimp user data validation
export const mailchimpUserZodSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Type for Mailchimp user data
export type MailchimpUserData = z.infer<typeof mailchimpUserZodSchema>;

// Interface for Mailchimp service methods
export interface IMailchimpService {
  ping(): Promise<{ status: string; message?: string }>;
  // eslint-disable-next-line no-unused-vars
  addOrUpdateUserToAudience(userData: MailchimpUserData): Promise<void>;
}
