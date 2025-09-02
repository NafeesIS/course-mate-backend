import { z } from 'zod';

const mongoId = z.union([
  z.string().regex(/^[a-f\d]{24}$/i, 'Invalid MongoDB ObjectId'),
  z.object({}).passthrough(),
]);

export const createCategoryValidationSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(2)
      .max(60)
      .regex(/^[a-zA-Z0-9\s-]+$/, 'Name can only contain letters, numbers, spaces, and hyphens'),
    slug: z
      .string()
      .min(4)
      .max(80)
      .regex(/^[a-z0-9\- ]+$/, 'Slug must be lowercase and can only contain hyphens and spaces')
      .optional(),
    description: z.string({ required_error: 'Description is required' }).min(4).max(500),
    metaTitle: z.string({ required_error: 'Meta title is required' }).min(4).max(60),
    metaDescription: z.string({ required_error: 'Meta description is required' }).min(4).max(500),
    status: z
      .enum(['active', 'archived'], {
        errorMap: () => ({ message: 'Status must be either active or archived' }),
      })
      .optional(),
  }),
});

export const createSubcategoryValidationSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(2)
      .max(60)
      .regex(/^[a-zA-Z0-9\s-]+$/, 'Name can only contain letters, numbers, spaces, and hyphens'),
    slug: z
      .string()
      .min(4)
      .max(80)
      .regex(/^[a-z0-9\- ]+$/, 'Slug must be lowercase and can only contain hyphens and spaces')
      .optional(),
    description: z.string({ required_error: 'Description is required' }).min(4).max(500),
    metaTitle: z.string({ required_error: 'Meta title is required' }).min(4).max(60),
    metaDescription: z.string({ required_error: 'Meta description is required' }).min(4).max(500),
    status: z
      .enum(['active', 'archived'], {
        errorMap: () => ({ message: 'Status must be either active or archived' }),
      })
      .optional(),
    categoryId: mongoId,
  }),
});

export const updateCategoryValidationSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(2)
        .max(60)
        .regex(/^[a-zA-Z0-9\s-]+$/, 'Name can only contain letters, numbers, spaces, and hyphens')
        .optional(),
      slug: z
        .string()
        .min(4)
        .max(80)
        .regex(/^[a-z0-9\- ]+$/, 'Slug must be lowercase and can only contain hyphens and spaces')
        .optional(),
      description: z.string().min(4).max(500).optional(),
      metaTitle: z.string().min(4).max(60).optional(),
      metaDescription: z.string().min(4).max(500).optional(),
      status: z.enum(['active', 'archived']).optional(),
    })
    .strict(),
});

export const updateSubcategoryValidationSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(2)
        .max(60)
        .regex(/^[a-zA-Z0-9\s-]+$/, 'Name can only contain letters, numbers, spaces, and hyphens')
        .optional(),
      slug: z
        .string()
        .min(4)
        .max(80)
        .regex(/^[a-z0-9\- ]+$/, 'Slug must be lowercase and can only contain hyphens and spaces')
        .optional(),
      description: z.string().min(4).max(500).optional(),
      metaTitle: z.string().min(4).max(60).optional(),
      metaDescription: z.string().min(4).max(500).optional(),
      status: z.enum(['active', 'archived']).optional(),
      isHomepage: z.string().optional(),
    })
    .strict(),
});

export const createTagValidationSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(2)
      .max(40)
      .regex(/^[a-zA-Z0-9]+$/, 'Name can only contain letters and numbers (no spaces or symbols)'),
    slug: z
      .string()
      .min(4)
      .max(80)
      .regex(/^[a-z0-9\- ]+$/, 'Slug must be lowercase and can only contain hyphens and spaces')
      .optional(),
  }),
});

export const updateTagValidationSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(2)
        .max(40)
        .regex(/^[a-zA-Z0-9]+$/, 'Name can only contain letters and numbers (no spaces or symbols)')
        .optional(),
      slug: z
        .string()
        .min(4)
        .max(80)
        .regex(/^[a-z0-9\- ]+$/, 'Slug must be lowercase and can only contain hyphens and spaces')
        .optional(),
    })
    .strict(),
});

export const createMediaValidationSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Title is required' })
      .min(2, 'Title must be at least 2 characters')
      .max(150, 'Title can be up to 150 characters')
      .optional(),
    type: z
      .enum(['image', 'jpeg', 'video', 'mp4'], {
        invalid_type_error: 'Invalid media type',
      })
      .optional(),
    url: z.string().url('Must be a valid URL').optional(),
  }),
});

export const updateMediaValidationSchema = z.object({
  body: z
    .object({
      title: z
        .string({ required_error: 'Title is required' })
        .min(2, 'Title must be at least 2 characters')
        .max(150, 'Title can be up to 150 characters'),
    })
    .strict()
    .optional(),
});

export const createDocValidationSchema = z.object({
  body: z.object({
    title: z.string().min(5).max(150, 'Title can be up to 150 characters'),
    slug: z
      .string()
      .regex(/^[a-z0-9\- ]+$/, 'Slug must be lowercase and can only contain hyphens and spaces')
      .min(4)
      .max(200, 'Slug can be up to 200 characters')
      .optional(),
    metaTitle: z.string().max(150, 'Meta title can be up to 150 characters'),
    metaDescription: z.string().max(160, 'Meta description can be up to 160 characters'),
    headerImageId: mongoId,
    thumbnailId: mongoId.optional(),
    mediaIds: z.array(mongoId).max(5, 'You can select maximum of 5 image/video').optional(),
    content: z.string().min(50, 'Content must be at least 50 characters long'),
    excerpt: z.string().max(160, 'Excerpt must be at most 160 characters long'),
    tagIds: z.array(mongoId).max(5, 'You can select maximum of 5 tags'),
    isFeatured: z.boolean().optional(),
    categoryId: mongoId,
    subcategoryId: mongoId.optional(),
    status: z.enum(['published', 'draft', 'archived']).optional(),
  }),
});

export const createDraftDocValidationSchema = z.object({
  body: z.object({
    title: z.string().min(5).max(150, 'Title can be up to 150 characters'),
    slug: z
      .string()
      .regex(/^[a-z0-9\- ]+$/, 'Slug must be lowercase and can only contain hyphens and spaces')
      .min(4)
      .max(200, 'Slug can be up to 200 characters')
      .optional(),
    metaTitle: z.string().max(150, 'Meta title can be up to 150 characters').optional(),
    metaDescription: z.string().max(160, 'Meta description can be up to 160 characters').optional(),
    headerImageId: mongoId.optional(),
    thumbnailId: mongoId.optional(),
    mediaIds: z.array(mongoId).max(5, 'You can select maximum of 5 image/video').optional(),
    content: z.string().optional(),
    excerpt: z.string().max(160, 'Excerpt must be at most 160 characters long').optional(),
    tagIds: z.array(mongoId).max(5, 'You can select maximum of 5 tags').optional(),
    isFeatured: z.boolean().optional(),
    // categoryId: mongoId.optional(),
    subcategoryId: mongoId.optional(),
    status: z.enum(['draft']),
  }),
});

export const updateDocValidationSchema = z.object({
  body: z.object({
    title: z.string().min(5).max(150, 'Title can be up to 150 characters').optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9\- ]+$/, 'Slug must be lowercase and can only contain hyphens and spaces')
      .min(4)
      .max(200, 'Slug can be up to 200 characters')
      .optional(),
    metaTitle: z.string().max(150, 'Meta title can be up to 150 characters').optional(),
    metaDescription: z.string().max(160, 'Meta description can be up to 160 characters').optional(),
    headerImageId: mongoId.optional(),
    thumbnailId: mongoId.optional(),
    mediaIds: z.array(mongoId).optional(),
    content: z.string().min(50, 'Content must be at least 50 characters long').optional(),
    excerpt: z.string().max(160, 'Excerpt must be at most 160 characters long').optional(),
    tagIds: z.array(mongoId).max(5, 'You can select a maximum of 5 tags').optional(),
    isFeatured: z.boolean().optional(),
    categoryId: mongoId.optional(),
    subcategoryId: mongoId.optional(),
    status: z.enum(['published', 'draft', 'archived']).optional(),
    likeCount: z.number().int().nonnegative().optional(),
    viewCount: z.number().int().nonnegative().optional(),
    shareCount: z.number().int().nonnegative().optional(),
  }),
});

export const createCommentValidationSchema = z.object({
  body: z.object({
    commentText: z
      .string({
        required_error: 'Comment is required',
      })
      .trim()
      .min(2, 'Comment must be at least 2 characters long')
      .max(300, 'Comment can be up to 300 characters long')
      .refine(val => !/^(.{1,10})\1+$/.test(val), 'Comment appears to be repetitive or spam'),
  }),
});

export const updateCommentValidationSchema = z.object({
  body: z.object({
    commentText: z
      .string({ required_error: 'Comment text is required' })
      .min(2, 'Comment must be at least 2 characters long')
      .max(300, 'Comment can be at most 300 characters long')
      .refine(val => !/^(.{1,10})\1+$/.test(val), 'Comment appears to be repetitive or spam'),
  }),
});

export const createReplyValidationSchema = z.object({
  body: z.object({
    replyText: z
      .string({
        required_error: 'Reply is required',
      })
      .trim()
      .min(2, 'Reply must be at least 2 characters long')
      .max(300, 'Reply can be up to 300 characters long')
      .refine(val => !/^(.{1,10})\1+$/.test(val), 'Reply appears to be repetitive or spam'),
    commentId: mongoId,
  }),
});

export const updateReplyValidationSchema = z.object({
  body: z.object({
    replyText: z
      .string({ required_error: 'Reply text is required' })
      .min(2, 'Reply must be at least 2 characters long')
      .max(300, 'Reply can be at most 300 characters long')
      .refine(val => !/^(.{1,10})\1+$/.test(val), 'Reply appears to be repetitive or spam'),
  }),
});
