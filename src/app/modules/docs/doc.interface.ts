// interface.ts
import mongoose from 'mongoose';

export interface ICategory {
  name: string;
  slug: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  status: 'active' | 'archived';
  createdBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubcategory extends ICategory {
  isHomepage?: boolean;
  categoryId: mongoose.Types.ObjectId;
}

export interface ITag {
  name: string;
  slug: string;
  createdBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocTag {
  tagId: mongoose.Types.ObjectId;
  docId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookmark {
  docId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment {
  commentedBy: mongoose.Types.ObjectId;
  docId: mongoose.Types.ObjectId;
  commentText: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReply {
  commentId: mongoose.Types.ObjectId;
  repliedBy: mongoose.Types.ObjectId;
  replyText: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMedia {
  url: string;
  title: string;
  type: 'image' | 'jpeg' | 'video' | 'mp4';
  uploadedBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDoc {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  authorId: mongoose.Types.ObjectId;
  headerImageId: mongoose.Types.ObjectId;
  thumbnailId: mongoose.Types.ObjectId;
  mediaIds?: mongoose.Types.ObjectId[];
  tagIds: mongoose.Types.ObjectId[];
  content: string;
  excerpt: string;
  categoryId: mongoose.Types.ObjectId;
  subcategoryId?: mongoose.Types.ObjectId;
  status: 'draft' | 'published' | 'archived';
  isFeatured: boolean;
  isDeleted: boolean;
  isHomepage: boolean;
  likeCount: number;
  viewCount: number;
  shareCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFilterOptions {
  categoryId?: string;
  subcategoryId?: string;
  status?: string;
  tagId?: string;
  isFeatured?: boolean;
  isHomepage?: boolean;
  from?: string;
  to?: string;
  sort?: 'asc' | 'desc';
  sortBy?: 'createdAt' | 'updatedAt';
  searchTerm?: string;
  timezone?: string;
  page?: number;
  limit?: number;
}

export interface IDocQuery {
  isDeleted: boolean;
  categoryId?: string;
  subcategoryId?: string;
  status?: string;
  tagIds?: { $in: string[] };
  isFeatured?: boolean;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
  [key: string]: unknown;
}

export interface ICommentReplyFilters {
  page?: number;
  limit?: number;
  sort?: 'asc' | 'desc';
}

export type TagSearchCondition = {
  isDeleted: boolean;
  $or: {
    name?: { $regex: string; $options: string };
    slug?: { $regex: string; $options: string };
  }[];
};

export type CategorySearchCondition = {
  isDeleted?: boolean;
  $or?: Array<{
    name?: { $regex: string; $options: string };
    slug?: { $regex: string; $options: string };
  }>;
};

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface ListMediaOptions {
  prefix?: string; // optional filter by "folder" prefix
  pageSize?: number; // max items per page
  continuationToken?: string | null; // for pagination
  withSas?: boolean; // if true, return SAS URLs
  sasTtlMinutes?: number; // SAS TTL in minutes
}

export interface MediaListItem {
  name: string;
  url: string; // plain or SAS url based on withSas
  size?: number;
  contentType?: string;
  lastModified?: string;
}

export interface MediaListResult {
  items: MediaListItem[];
  continuationToken?: string | null;
}

export type UpdateMediaInput = {
  name: string;
  newName?: string;
  metadata?: Record<string, string | undefined>;
  httpHeaders?: {
    contentType?: string;
    contentEncoding?: string;
    contentLanguage?: string;
    cacheControl?: string;
    contentDisposition?: string;
    contentMD5?: Uint8Array;
  };
  ifMatch?: string;
};
