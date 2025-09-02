import { z } from 'zod';

export const recentSearchZodSchema = z.object({
  type: z.enum(['company', 'director']),
  path: z.string(),
  idNo: z.string(),
  name: z.string(),
  count: z.number().optional(),
});

export type RecentSearchDTO = z.infer<typeof recentSearchZodSchema>;
