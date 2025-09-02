import { z } from 'zod';

/**
 * Represents a Data Transfer Object (DTO) for a lead entity.
 * This interface defines the structure of data expected when creating or updating a lead.
 */
export interface LeadDTO {
  name: string;
  email: string;
  contactNo: string;
  serviceType: string[];
  otherService?: string | null;
  sources: string[];
  pathname: string;
  isContacted?: boolean | null;
  leadConverted?: boolean | null;
  convertingRemarkReason?: string;
  contactingFailedReason?: string;
  nextCallSchedule?: Date | null;
  customerReqCallSchedule?: Date | null;
  customerReqFollowUpTime?: string;
  followUpTime?: string;
  isQualified?: boolean | null;
  hitsCount?: number | null;
}

export const leadZodSchema = z.object({
  name: z.string().nonempty(),
  email: z.string().email(),
  contactNo: z.string().nonempty(),
  serviceType: z.array(z.string()).min(1),
  otherService: z.string().optional(),
  sources: z.array(z.string()).min(1), // Array of strings with at least one element
  pathname: z.string().nonempty(),
  isContacted: z.boolean().optional(),
  leadConverted: z.boolean().optional(),
});

// Interface of email unsubscribe
export interface IUnsubscribe {
  email: string;
  unsubscribedAt: Date;
}
