import { BlockBlobClient } from '@azure/storage-blob';
import httpStatus from 'http-status';
import mongoose, { PipelineStage, Types } from 'mongoose';
import AppError from '../../errors/AppError';
import { UserModel } from '../user/user.model';
import {
  ICategory,
  IComment,
  ICommentReplyFilters,
  IDoc,
  IFilterOptions,
  IMedia,
  IReply,
  ISubcategory,
  ITag,
  ListMediaOptions,
  MediaListItem,
  MediaListResult,
  UpdateMediaInput,
} from './doc.interface';
import {
  BookmarkModel,
  CategoryModel,
  DocCommentModel,
  DocMediaModel,
  DocModel,
  DocReplyModel,
  SubcategoryModel,
  TagModel,
} from './doc.model';
import {
  assertBlobExists,
  buildReadSasUrl,
  copyRenameBlob,
  deleteBlobIncludeSnapshots,
  fetchBlobProps,
  getBlobServiceAndContainer,
  getContainer,
  refineCategoryPayload,
  refineDocPayload,
  refineDraftDocPayload,
  refineNameTitleField,
  refineTagsPayload,
  sanitizeTextField,
  setHTTPHeadersSafe,
  setMetadataSafe,
} from './doc.utils';

const createCategoryIntoDB = async (payload: ICategory, uId: string) => {
  const user = await UserModel.findOne({ uId });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  const refinedCategoryPayload = refineCategoryPayload(payload);
  refinedCategoryPayload.createdBy = user._id;
  const categoryCreated = await CategoryModel.create(refinedCategoryPayload);
  return categoryCreated;
};

const getAllCategoriesFromDB = async (
  sortOrder: 'asc' | 'desc' = 'desc',
  sortBy: 'createdAt' | 'updatedAt' = 'createdAt',
  page?: number,
  limit?: number,
  searchTerm?: string
) => {
  const sortValue: 1 | -1 = sortOrder === 'asc' ? 1 : -1;
  const pipeline: PipelineStage[] = [];

  // Use Atlas Search if searchTerm exists
  if (searchTerm) {
    pipeline.push({
      $search: {
        index: 'categories_search',
        compound: {
          should: [
            {
              autocomplete: {
                query: searchTerm,
                path: 'name',
                tokenOrder: 'sequential',
                fuzzy: { maxEdits: 2, prefixLength: 0 },
              },
            },
            {
              autocomplete: {
                query: searchTerm,
                path: 'slug',
                tokenOrder: 'sequential',
                fuzzy: { maxEdits: 2, prefixLength: 0 },
              },
            },
            {
              text: {
                query: searchTerm,
                path: ['name', 'slug'],
                fuzzy: { maxEdits: 2, prefixLength: 0 },
              },
            },
          ],
        },
      },
    } as PipelineStage);

    pipeline.push({
      $addFields: { score: { $meta: 'searchScore' } },
    });

    pipeline.push({
      $sort: { score: -1, [sortBy]: sortValue, _id: 1 },
    } as PipelineStage);
  }

  // Always filter out deleted categories
  pipeline.push({ $match: { isDeleted: false } });
  pipeline.push({ $sort: { [sortBy]: sortValue, _id: 1 } } as PipelineStage);

  if (page && limit) {
    const skip = (page - 1) * limit;

    pipeline.push(
      {
        $facet: {
          results: [
            {
              $lookup: {
                from: 'users',
                localField: 'createdBy',
                foreignField: '_id',
                pipeline: [{ $project: { meta_data: 1, emails: 1, profilePicture: 1 } }],
                as: 'createdBy',
              },
            },
            { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
            { $skip: skip },
            { $limit: limit },
          ],
          total: [{ $count: 'count' }],
        },
      },
      {
        $project: {
          categories: '$results',
          meta: {
            total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
            page: { $literal: page },
            limit: { $literal: limit },
            totalPages: {
              $ceil: {
                $divide: [{ $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] }, limit],
              },
            },
          },
        },
      }
    );

    const [doc] = await CategoryModel.aggregate(pipeline).exec();
    return doc ?? { meta: { total: 0, page, limit, totalPages: 0 }, categories: [] };
  }

  // Non-paginated path
  const categories = await CategoryModel.find({ isDeleted: false }).select(
    'name slug metaTitle metaDescription description'
  );

  return { categories };
};

const getSingleCategoryDetailsFromDB = async (id: string) => {
  const category = await CategoryModel.findOne({ _id: id, isDeleted: false });
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  }

  const subcategories = await SubcategoryModel.find({ categoryId: id, isDeleted: false }).select(
    'name slug'
  );

  return {
    ...category.toObject(),
    subcategories,
  };
};

const updateCategoryIntoDB = async (id: string, payload: Partial<ICategory>) => {
  const refinedCategoryPayload = refineCategoryPayload(payload);
  const categoryUpdated = await CategoryModel.findByIdAndUpdate(id, refinedCategoryPayload, {
    new: true,
  });
  return categoryUpdated;
};

const softDeleteCategory = async (id: string) => {
  const hasSubcategories = await SubcategoryModel.exists({ categoryId: id, isDeleted: false });
  const hasDocs = await DocModel.exists({ categoryId: id, isDeleted: false });

  if (hasSubcategories || hasDocs) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Cannot delete category with existing subcategories or docs'
    );
  }

  const deleted = await CategoryModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  return deleted;
};

const permanentDeleteCategoryFromDB = async (id: string) => {
  const hasSubcategories = await SubcategoryModel.exists({ categoryId: id, isDeleted: false });
  const hasDocs = await DocModel.exists({ categoryId: id, isDeleted: false });

  if (hasSubcategories || hasDocs) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Cannot delete category with existing subcategories or docs'
    );
  }
  const categoryDeleted = await CategoryModel.findByIdAndDelete(id);
  return categoryDeleted;
};

const createSubcategoryIntoDB = async (payload: ISubcategory, uId: string) => {
  const user = await UserModel.findOne({ uId });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  const refinedSubcategoryPayload = refineCategoryPayload(payload);
  refinedSubcategoryPayload.createdBy = user._id;
  const subcategoryCreated = await SubcategoryModel.create(refinedSubcategoryPayload);
  return subcategoryCreated;
};

export const getAllSubcategoriesFromDB = async (
  sortOrder: 'asc' | 'desc' = 'desc',
  sortBy: 'createdAt' | 'updatedAt' = 'createdAt',
  page?: number,
  limit?: number,
  searchTerm?: string
) => {
  const sortValue: 1 | -1 = sortOrder === 'asc' ? 1 : -1;
  const pipeline: PipelineStage[] = [];

  if (searchTerm) {
    pipeline.push({
      $search: {
        index: 'subcategories_search',
        compound: {
          should: [
            {
              autocomplete: {
                query: searchTerm,
                path: 'name',
                tokenOrder: 'sequential',
                fuzzy: { maxEdits: 2, prefixLength: 0 },
              },
            },
            {
              autocomplete: {
                query: searchTerm,
                path: 'slug',
                tokenOrder: 'sequential',
                fuzzy: { maxEdits: 2, prefixLength: 0 },
              },
            },
            {
              text: {
                query: searchTerm,
                path: ['name', 'slug'],
                fuzzy: { maxEdits: 2, prefixLength: 0 },
              },
            },
          ],
        },
      },
    } as PipelineStage); // ✅ safely asserted
    pipeline.push({
      $addFields: {
        score: { $meta: 'searchScore' },
      },
    });
    pipeline.push({
      $sort: { score: -1, [sortBy]: sortValue, _id: 1 },
    } as PipelineStage);
  }

  pipeline.push({ $sort: { [sortBy]: sortValue, _id: 1 } } as PipelineStage);
  pipeline.push({ $match: { isDeleted: false } });

  if (page && limit) {
    const skip = (page - 1) * limit;

    pipeline.push(
      {
        $facet: {
          results: [
            {
              $lookup: {
                from: 'users',
                localField: 'createdBy',
                foreignField: '_id',
                pipeline: [{ $project: { meta_data: 1, emails: 1, profilePicture: 1 } }],
                as: 'createdBy',
              },
            },
            { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },

            // include category info similar to how tags included createdBy
            {
              $lookup: {
                from: 'doc_categories',
                localField: 'categoryId',
                foreignField: '_id',
                pipeline: [{ $project: { name: 1, slug: 1 } }],
                as: 'categoryId',
              },
            },
            { $unwind: { path: '$categoryId', preserveNullAndEmptyArrays: true } },

            { $skip: skip },
            { $limit: limit },
          ],
          total: [{ $count: 'count' }],
        },
      },
      {
        $project: {
          subcategories: '$results',
          meta: {
            total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
            page: { $literal: page },
            limit: { $literal: limit },
            totalPages: {
              $ceil: {
                $divide: [{ $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] }, limit],
              },
            },
          },
        },
      }
    );

    const [doc] = await SubcategoryModel.aggregate(pipeline).exec();
    return doc ?? { meta: { total: 0, page, limit, totalPages: 0 }, subcategories: [] };
  }

  // non-paginated path mirrors tags: plain find with isDeleted:false + sort
  const subcategories = await SubcategoryModel.find({ isDeleted: false }).sort({
    [sortBy]: sortValue,
  });
  return { subcategories };
};

const getSingleSubcategoryDetailsFromDB = async (id: string) => {
  const subcategory = await SubcategoryModel.findOne({ _id: id, isDeleted: false });
  if (!subcategory) {
    throw new AppError(httpStatus.NOT_FOUND, 'Subcategory not found');
  }
  return subcategory;
};

const getSubcategoriesByCategoryIdFromDB = async (
  categoryId: string,
  page?: number,
  limit?: number
) => {
  const query = { categoryId, isDeleted: false };

  if (limit && page) {
    const skip = (page - 1) * limit;
    const subcategories = await SubcategoryModel.find(query).skip(skip).limit(limit);
    const total = await SubcategoryModel.countDocuments(query);

    return {
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      subcategories,
    };
  }

  const subcategories = await SubcategoryModel.find({ categoryId, isDeleted: false });
  return { subcategories };
};

const updateSubcategoryIntoDB = async (id: string, payload: Partial<ISubcategory>) => {
  const refinedSubcategoryPayload = refineCategoryPayload(payload);
  const subcategoryUpdated = await SubcategoryModel.findByIdAndUpdate(
    id,
    refinedSubcategoryPayload,
    {
      new: true,
    }
  );
  return subcategoryUpdated;
};

const softDeleteSubcategory = async (id: string) => {
  const hasDocs = await DocModel.exists({ subcategoryId: id, isDeleted: false });
  if (hasDocs) {
    throw new AppError(httpStatus.CONFLICT, 'Cannot delete subcategory with existing docs');
  }
  const subcategoryDeleted = await SubcategoryModel.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
  return subcategoryDeleted;
};

const permanentDeleteSubcategoryFromDB = async (id: string) => {
  const hasDocs = await DocModel.exists({ subcategoryId: id, isDeleted: false });
  if (hasDocs) {
    throw new AppError(httpStatus.CONFLICT, 'Cannot delete subcategory with existing docs');
  }
  const subcategoryDeleted = await SubcategoryModel.findByIdAndDelete(id);
  return subcategoryDeleted;
};

const createTagIntoDB = async (payload: ITag, uId: string) => {
  const user = await UserModel.findOne({ uId });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  const userId = user._id;
  const refineTagPayload = refineTagsPayload(payload);
  refineTagPayload.createdBy = userId;
  const tagCreated = await TagModel.create(refineTagPayload);
  return tagCreated;
};

const updateTagIntoDB = async (id: string, payload: Partial<ITag>) => {
  const refineTagPayload = refineTagsPayload(payload);
  const tagUpdated = await TagModel.findByIdAndUpdate(id, refineTagPayload, {
    new: true,
  });
  return tagUpdated;
};

export const getAllTagsFromDB = async (
  sortOrder: 'asc' | 'desc' = 'desc',
  sortBy: 'createdAt' | 'updatedAt' = 'createdAt',
  page?: number,
  limit?: number,
  searchTerm?: string
) => {
  const sortValue: 1 | -1 = sortOrder === 'asc' ? 1 : -1;
  const pipeline: PipelineStage[] = [];
  if (searchTerm) {
    pipeline.push({
      $search: {
        index: 'tags_search',
        compound: {
          should: [
            {
              autocomplete: {
                query: searchTerm,
                path: 'name',
                tokenOrder: 'sequential',
                fuzzy: { maxEdits: 2, prefixLength: 0 },
              },
            },
            {
              autocomplete: {
                query: searchTerm,
                path: 'slug',
                tokenOrder: 'sequential',
                fuzzy: { maxEdits: 2, prefixLength: 0 },
              },
            },
            {
              text: {
                query: searchTerm,
                path: ['name', 'slug'],
                fuzzy: { maxEdits: 2, prefixLength: 0 },
              },
            },
          ],
        },
      },
    } as PipelineStage); // ✅ safely asserted
    pipeline.push({
      $addFields: {
        score: { $meta: 'searchScore' },
      },
    });
    pipeline.push({
      $sort: { score: -1, [sortBy]: sortValue, _id: 1 },
    } as PipelineStage);
  }

  pipeline.push({ $sort: { [sortBy]: sortValue, _id: 1 } } as PipelineStage);
  pipeline.push({ $match: { isDeleted: false } });
  if (page && limit) {
    const skip = (page - 1) * limit;

    pipeline.push(
      {
        $facet: {
          results: [
            {
              $lookup: {
                from: 'users',
                localField: 'createdBy',
                foreignField: '_id',
                pipeline: [{ $project: { meta_data: 1, emails: 1, profilePicture: 1 } }],
                as: 'createdBy',
              },
            },
            { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
            { $skip: skip },
            { $limit: limit },
          ],
          total: [{ $count: 'count' }],
        },
      } as PipelineStage,
      {
        $project: {
          tags: '$results',
          meta: {
            total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
            page: { $literal: page },
            limit: { $literal: limit },
            totalPages: {
              $ceil: {
                $divide: [{ $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] }, limit],
              },
            },
          },
        },
      } as PipelineStage
    );

    const [doc] = await TagModel.aggregate(pipeline).exec();
    return doc ?? { meta: { total: 0, page, limit, totalPages: 0 }, tags: [] };
  }

  // fallback when no searchTerm
  const tags = await TagModel.find({ isDeleted: false }).sort({
    [sortBy]: sortValue,
  });
  return { tags };
};

const getSingleTagFromDB = async (id: string) => {
  const tag = await SubcategoryModel.findOne({ _id: id, isDeleted: false });
  if (!tag) {
    throw new AppError(httpStatus.NOT_FOUND, 'Tag not found');
  }
  return tag;
};

const getDocsByTagFromDB = async (tagId: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const query = { tagIds: tagId, isDeleted: false };

  const [docs, total] = await Promise.all([
    DocModel.find(query)
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'meta_data emails profilePicture')
      .populate('headerImageId', 'url title')
      .populate('thumbnailId', 'url title')
      .populate('categoryId', 'name slug')
      .populate('subcategoryId', 'name slug'),
    DocModel.countDocuments(query),
  ]);

  return {
    meta: {
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit),
    },
    data: docs,
  };
};

const softDeleteTagFromDB = async (id: string) => {
  // Check if any doc (not deleted) references this tag
  const hasDocs = await DocModel.exists({
    tagIds: id,
    isDeleted: false,
  });

  if (hasDocs) {
    throw new AppError(httpStatus.CONFLICT, 'Cannot delete tag used in existing docs');
  }

  const tagDeleted = await TagModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  return tagDeleted;
};

const createMediaIntoDB = async (payload: Partial<IMedia>, uId: string) => {
  const user = await UserModel.findOne({ uId });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  const userId = user._id;
  if (payload.title) {
    payload.title = refineNameTitleField(payload.title);
  }

  payload.uploadedBy = userId;
  const allowedTypes = ['image', 'jpeg', 'video', 'mp4'];
  const fileType = payload.type;

  if (fileType && !allowedTypes.includes(fileType)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Invalid media type: ${fileType}. Only image/jpeg or video/mp4 files are allowed`
    );
  }

  const mediaCreated = await DocMediaModel.create(payload);
  return mediaCreated;
};

const listAzureMedia = async (opts: ListMediaOptions = {}): Promise<MediaListResult> => {
  const { container } = getBlobServiceAndContainer();

  const pageSize = Math.min(Math.max(opts.pageSize ?? 50, 1), 500); // clamp 1..500
  const byPageIter = container
    .listBlobsFlat({ prefix: opts.prefix })
    .byPage({ maxPageSize: pageSize, continuationToken: opts.continuationToken ?? undefined });

  const { value } = await byPageIter.next();
  const items: MediaListItem[] = [];

  for (const b of value.segment.blobItems) {
    const url = opts.withSas
      ? buildReadSasUrl(container.containerName, b.name, opts.sasTtlMinutes ?? 10)
      : container.getBlobClient(b.name).url;

    items.push({
      name: b.name,
      url,
      size: b.properties.contentLength,
      contentType: b.properties.contentType,
      lastModified: b.properties.lastModified?.toISOString(),
    });
  }

  return {
    items,
    continuationToken: value.continuationToken ?? null,
  };
};

const deleteAzureMedia = async (name: string): Promise<void> => {
  const container = getContainer();
  const blob = container.getBlobClient(name);
  await assertBlobExists(blob as BlockBlobClient);
  await deleteBlobIncludeSnapshots(blob as BlockBlobClient);
};

const updateAzureMedia = async (
  input: UpdateMediaInput
): Promise<{
  name: string;
  etag?: string;
  lastModified?: string;
}> => {
  const { name, newName, metadata, httpHeaders, ifMatch } = input;
  const container = getContainer();
  const sourceBlob = container.getBlockBlobClient(name);
  await assertBlobExists(sourceBlob);

  let targetBlob = sourceBlob;
  let finalName = name;

  // rename: copy → delete
  if (newName && newName !== name) {
    finalName = newName;
    targetBlob = container.getBlockBlobClient(newName);
    await copyRenameBlob(sourceBlob, targetBlob, ifMatch, 15);
    await deleteBlobIncludeSnapshots(sourceBlob);
  }

  // updates
  await setMetadataSafe(targetBlob, metadata, ifMatch);
  await setHTTPHeadersSafe(targetBlob, httpHeaders, ifMatch);

  const { etag, lastModified } = await fetchBlobProps(targetBlob);
  return { name: finalName, etag, lastModified };
};

const updateMediaIntoDB = async (id: string, payload: Partial<IMedia>) => {
  if (payload.title) {
    payload.title = refineNameTitleField(payload.title);
  }
  const mediaUpdated = await DocMediaModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  return mediaUpdated;
};

const getAllMediaFromDB = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    DocMediaModel.find({ isDeleted: false }).skip(skip).limit(limit),
    DocMediaModel.countDocuments({ isDeleted: false }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleMediaFromDB = async (id: string) => {
  const media = await DocMediaModel.findOne({ _id: id, isDeleted: false });
  if (!media) {
    throw new AppError(httpStatus.NOT_FOUND, 'Media not found');
  }
  return media;
};

const softDeleteMediaFromDB = async (id: string) => {
  const hasDocs = await DocModel.exists({
    mediaIds: id,
    isDeleted: false,
  });

  if (hasDocs) {
    throw new AppError(httpStatus.CONFLICT, 'Cannot delete media used in existing docs');
  }

  const mediaDeleted = await DocMediaModel.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
  return mediaDeleted;
};

const createDocIntoDB = async (payload: IDoc, uId: string) => {
  const user = await UserModel.findOne({ uId });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  const userId = user._id;
  const refinedPayload = refineDocPayload(payload);
  refinedPayload.authorId = userId;
  const created = await DocModel.create(refinedPayload);
  return created;
};

const createDraftDocIntoDB = async (payload: IDoc, uId: string) => {
  const user = await UserModel.findOne({ uId });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  const userId = user._id;
  const refinedPayload = refineDraftDocPayload(payload);
  refinedPayload.authorId = userId;
  const created = await DocModel.create(refinedPayload);
  return created;
};

const getAllDocsFromDB = async (filters: IFilterOptions) => {
  const {
    categoryId,
    subcategoryId,
    tagId,
    status,
    isFeatured,
    isHomepage,
    from,
    to,
    sort = 'desc',
    sortBy = 'createdAt',
    searchTerm,
    page = 1,
    limit = 10,
  } = filters;
  const objectCategoryId = new Types.ObjectId(categoryId);
  const objectSubcategoryId = new Types.ObjectId(subcategoryId);
  const objectTagId = new Types.ObjectId(tagId);
  const sortValue: 1 | -1 = sort === 'asc' ? 1 : -1;
  const pipeline: PipelineStage[] = [];

  // Atlas Search
  if (searchTerm) {
    pipeline.push({
      $search: {
        index: 'docSearchAdmin',
        compound: {
          should: [
            {
              autocomplete: {
                query: searchTerm,
                path: 'title',
                tokenOrder: 'sequential',
                fuzzy: { maxEdits: 2, prefixLength: 0 },
              },
            },
            {
              autocomplete: {
                query: searchTerm,
                path: 'slug',
                tokenOrder: 'sequential',
                fuzzy: { maxEdits: 2, prefixLength: 0 },
              },
            },
            {
              text: {
                query: searchTerm,
                path: ['title', 'slug'],
                fuzzy: { maxEdits: 2, prefixLength: 0 },
              },
            },
          ],
        },
      },
    } as PipelineStage);

    pipeline.push({ $addFields: { score: { $meta: 'searchScore' } } });
    pipeline.push({ $sort: { score: -1, [sortBy]: sortValue, _id: 1 } } as PipelineStage);
  }

  // Apply filters using $redact instead of $match
  pipeline.push({
    $redact: {
      $cond: [
        {
          $and: [
            { $eq: ['$isDeleted', false] },
            status ? { $eq: ['$status', status] } : { $literal: true },
            isFeatured !== undefined ? { $eq: ['$isFeatured', isFeatured] } : { $literal: true },
            isHomepage !== undefined ? { $eq: ['$isHomepage', isHomepage] } : { $literal: true },
            categoryId ? { $eq: ['$categoryId', objectCategoryId] } : { $literal: true },
            subcategoryId ? { $eq: ['$subcategoryId', objectSubcategoryId] } : { $literal: true },
            tagId ? { $in: [objectTagId, '$tagIds'] } : { $literal: true },
            from ? { $gte: ['$createdAt', new Date(from)] } : { $literal: true },
            to ? { $lte: ['$createdAt', new Date(to)] } : { $literal: true },
          ],
        },
        '$$KEEP',
        '$$PRUNE',
      ],
    },
  });

  // Sort again after $redact if needed
  pipeline.push({ $sort: { [sortBy]: sortValue, _id: 1 } } as PipelineStage);

  // Pagination and lookups
  const skip = (page - 1) * limit;
  pipeline.push(
    {
      $facet: {
        results: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'createdBy',
              foreignField: '_id',
              pipeline: [{ $project: { meta_data: 1, emails: 1, profilePicture: 1 } }],
              as: 'createdBy',
            },
          },
          { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'doc_categories',
              localField: 'categoryId',
              foreignField: '_id',
              pipeline: [{ $project: { name: 1, slug: 1 } }],
              as: 'categoryId',
            },
          },
          { $unwind: { path: '$categoryId', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'doc_subcategories',
              localField: 'subcategoryId',
              foreignField: '_id',
              pipeline: [{ $project: { name: 1, slug: 1 } }],
              as: 'subcategoryId',
            },
          },
          { $unwind: { path: '$subcategoryId', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'tags',
              localField: 'tagIds',
              foreignField: '_id',
              pipeline: [{ $project: { name: 1, slug: 1 } }],
              as: 'tagIds',
            },
          },
          { $unwind: { path: '$tagId', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'doc_medias',
              localField: 'headerImageId',
              foreignField: '_id',
              pipeline: [{ $project: { url: 1, title: 1 } }],
              as: 'headerImageId',
            },
          },
          { $unwind: { path: '$headerImageId', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'doc_medias',
              localField: 'thumbnailId',
              foreignField: '_id',
              pipeline: [{ $project: { url: 1, title: 1 } }],
              as: 'thumbnailId',
            },
          },
          { $unwind: { path: '$thumbnailId', preserveNullAndEmptyArrays: true } },
        ],
        total: [{ $count: 'count' }],
        homepageCount: [{ $match: { isHomepage: true } }, { $count: 'count' }],
      },
    },
    {
      $project: {
        data: '$results',
        meta: {
          total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
          homepageTotal: { $ifNull: [{ $arrayElemAt: ['$homepageCount.count', 0] }, 0] },
          page: { $literal: page },
          limit: { $literal: limit },
          pageCount: {
            $ceil: {
              $divide: [{ $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] }, limit],
            },
          },
        },
      },
    }
  );

  const [doc] = await DocModel.aggregate(pipeline).exec();
  return doc ?? { meta: { total: 0, page, limit, pageCount: 0 }, data: [] };
};

const getSingleDocDetailsFromDB = async (identifier: string) => {
  const isValidObjectId = mongoose.Types.ObjectId.isValid(identifier);

  const query = isValidObjectId
    ? { _id: identifier, isDeleted: false }
    : { slug: identifier, isDeleted: false };

  const doc = await DocModel.findOne(query)
    .populate('authorId', 'meta_data emails profilePicture')
    .populate('headerImageId', 'url title')
    .populate('thumbnailId', 'url title')
    .populate('mediaIds', 'url title')
    .populate('categoryId', 'name slug')
    .populate('subcategoryId', 'name slug')
    .populate('tagIds', 'name slug');

  if (!doc) {
    throw new AppError(httpStatus.NOT_FOUND, 'Doc not found');
  }

  return doc;
};

// const searchDocsFromDB = async (searchText: string) => {
//   const pipeline = [
//     {
//       $search: {
//         index: 'default',
//         compound: {
//           should: [
//             {
//               autocomplete: {
//                 query: searchText,
//                 path: 'title',
//                 tokenOrder: 'sequential',
//               },
//             },
//             {
//               text: {
//                 query: searchText,
//                 path: 'title',
//                 fuzzy: { maxEdits: 2, prefixLength: 0 },
//               },
//             },
//           ],
//         },
//       },
//     },
//     { $match: { isDeleted: false } },

//     // category population
//     {
//       $lookup: {
//         from: 'doc_categories',
//         localField: 'categoryId',
//         foreignField: '_id',
//         as: 'category',
//       },
//     },
//     { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },

//     // subcategory population
//     {
//       $lookup: {
//         from: 'doc_subcategories',
//         localField: 'subcategoryId',
//         foreignField: '_id',
//         as: 'subcategory',
//       },
//     },
//     { $unwind: { path: '$subcategory', preserveNullAndEmptyArrays: true } },

//     // Tag population
//     {
//       $lookup: {
//         from: 'tags',
//         localField: 'tagIds',
//         foreignField: '_id',
//         as: 'tags',
//       },
//     },

//     { $limit: 10 },

//     {
//       $project: {
//         _id: 1,
//         title: 1,
//         slug: 1,
//         excerpt: 1,
//         createdAt: 1,
//         suggest: 1,
//         // score: { $meta: 'searchScore' },
//         category: { name: 1, slug: 1 },
//         subcategory: { name: 1, slug: 1 },
//         tags: { name: 1, slug: 1 },
//       },
//     },
//   ];

//   const result = await DocModel.aggregate(pipeline);
//   return result;
// };

const searchDocsFromDB = async (searchText: string) => {
  const pipeline: PipelineStage[] = [
    {
      $search: {
        index: 'docSearch',
        compound: {
          should: [
            {
              autocomplete: {
                query: searchText,
                path: 'title',
              },
            },
            {
              text: {
                query: searchText,
                path: 'title',
                fuzzy: {
                  maxEdits: 2,
                  prefixLength: 0,
                },
              },
            },
            {
              text: {
                query: searchText,
                path: 'excerpt',
              },
            },
          ],
        },
      },
    },
    { $match: { isDeleted: false } },

    // category population
    {
      $lookup: {
        from: 'doc_categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },

    // subcategory population
    {
      $lookup: {
        from: 'doc_subcategories',
        localField: 'subcategoryId',
        foreignField: '_id',
        as: 'subcategory',
      },
    },
    { $unwind: { path: '$subcategory', preserveNullAndEmptyArrays: true } },

    // tags population
    {
      $lookup: {
        from: 'tags',
        localField: 'tagIds',
        foreignField: '_id',
        as: 'tags',
      },
    },
    {
      $sort: { score: -1 },
    },
    { $limit: 10 },

    {
      $project: {
        _id: 1,
        title: 1,
        slug: 1,
        content: 1,
        excerpt: 1,
        createdAt: 1,
        score: { $meta: 'searchScore' },
        category: { name: 1, slug: 1 },
        subcategory: { name: 1, slug: 1 },
        tags: { name: 1, slug: 1 },
      },
    },
  ];

  const result = await DocModel.aggregate(pipeline);
  return result;
};

const updateDocIntoDB = async (id: string, payload: Partial<IDoc>, uId: string) => {
  const user = await UserModel.findOne({ uId });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  // const userId = user._id;
  const refinedPayload = refineDocPayload(payload);
  const docUpdated = await DocModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    refinedPayload,
    { new: true }
  );

  if (!docUpdated) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to update this document');
  }

  return docUpdated;
};

const updateDraftDocIntoDB = async (id: string, payload: Partial<IDoc>, uId: string) => {
  const user = await UserModel.findOne({ uId });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  // const userId = user._id;
  const refinedPayload = refineDraftDocPayload(payload);
  const docUpdated = await DocModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    refinedPayload,
    { new: true }
  );

  if (!docUpdated) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to update this document');
  }

  return docUpdated;
};

const deleteDocFromDB = async (id: string, uId: string) => {
  const user = await UserModel.findOne({ uId });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  const userId = user._id;
  const isAdmin = user.roles.includes('admin');
  // Fetch the associated doc to check if user is the author
  const doc = await DocModel.findOne({ _id: id, isDeleted: false }).lean();
  if (!doc) {
    throw new AppError(httpStatus.NOT_FOUND, 'Associated document not found');
  }
  const isAuthor = doc.authorId?.toString() === userId.toString();
  if (!isAuthor && !isAdmin) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not allowed to delete this doc');
  }

  const docDeleted = await DocModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

  if (docDeleted) {
    // 1. Soft delete all comments associated with the doc
    await DocCommentModel.updateMany(
      { docId: id, isDeleted: false },
      { $set: { isDeleted: true } }
    );

    // 2. Find all comment IDs associated with the doc
    const commentIds = await DocCommentModel.find({ docId: id }, { _id: 1 }).lean();

    const commentIdList = commentIds.map(c => c._id);

    // 3. Soft delete all replies associated with those comments
    if (commentIdList.length > 0) {
      await DocReplyModel.updateMany(
        { commentId: { $in: commentIdList } },
        { $set: { isDeleted: true } }
      );
    }
  }

  return docDeleted;
};

const createCommentIntoDB = async (payload: IComment, uId: string, docId: string) => {
  const user = await UserModel.findOne({ uId });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  const isVerified = user.meta_data?.mobileNumber;
  if (!isVerified) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User is not verified');
  }
  const docs = await DocModel.findOne({ _id: docId });
  if (!docs) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'docs not found');
  }

  if (payload.commentText) {
    payload.commentText = sanitizeTextField(payload.commentText);
  }
  payload.commentedBy = user._id;
  payload.docId = docs._id;

  const commentCreated = await DocCommentModel.create(payload);

  const populatedComment = await DocCommentModel.findById(commentCreated._id).populate(
    'commentedBy',
    'meta_data profilePicture emails'
  );

  return populatedComment;
};

const getCommentsByDocIdFromDB = async (docId: string, filters: ICommentReplyFilters) => {
  const { page = 1, limit = 10, sort } = filters;
  const sortValue = sort === 'asc' ? 1 : -1;
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    DocCommentModel.find({ docId, isDeleted: false })
      .populate('commentedBy', 'meta_data profilePicture emails')
      .sort({ createdAt: sortValue })
      .skip(skip)
      .limit(limit),
    DocCommentModel.countDocuments({ docId, isDeleted: false }),
  ]);

  // Add replyCount to each comment
  const commentsWithReplyCount = await Promise.all(
    comments.map(async comment => {
      const replyCount = await DocReplyModel.countDocuments({
        commentId: comment._id,
        isDeleted: false,
      });

      return {
        ...comment.toObject(), // Convert mongoose document to plain object
        replyCount,
      };
    })
  );
  const hasMore = page * limit < total;
  return {
    meta: {
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit),
      hasMore,
    },
    data: commentsWithReplyCount,
  };
};

const updateCommentIntoDB = async (commentId: string, uId: string, text: string) => {
  const user = await UserModel.findOne({ uId });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const userId = user._id;
  const sanitizeText = sanitizeTextField(text);
  const updatedComment = await DocCommentModel.findOneAndUpdate(
    { _id: commentId, commentedBy: userId, isDeleted: false },
    { commentText: sanitizeText },
    { new: true }
  );

  if (!updatedComment) {
    throw new AppError(httpStatus.FORBIDDEN, 'You do not have permission to edit this comment');
  }
  const populatedComment = await DocCommentModel.findById(updatedComment._id).populate(
    'commentedBy',
    'meta_data profilePicture emails'
  );
  return populatedComment;
};

const deleteCommentIntoDB = async (commentId: string, uId: string) => {
  const user = await UserModel.findOne({ uId });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  const userId = user._id;
  const isAdmin = user.roles.includes('admin');
  // Fetch the comment to check ownership and associated doc
  const comment = await DocCommentModel.findOne({ _id: commentId, isDeleted: false });
  if (!comment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Comment not found');
  }

  // Fetch the associated doc to check if user is the author
  const doc = await DocModel.findOne({ _id: comment.docId, isDeleted: false }).lean();
  if (!doc) {
    throw new AppError(httpStatus.NOT_FOUND, 'Associated document not found');
  }

  // Check if the user is either the commenter or the doc's author
  const isCommenter = comment.commentedBy.toString() === userId.toString();
  const isAuthor = doc.authorId?.toString() === userId.toString();
  if (!isCommenter && !isAuthor && !isAdmin) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not allowed to delete this comment');
  }

  const deletedComment = await DocCommentModel.findOneAndUpdate(
    { _id: commentId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );

  if (deletedComment) {
    // Soft delete all replies for the comment
    await DocReplyModel.updateMany({ commentId: commentId }, { $set: { isDeleted: true } });
  }
  if (!deletedComment) {
    throw new AppError(httpStatus.FORBIDDEN, 'You do not have permission to delete this comment');
  }
  const populatedComment = await DocCommentModel.findById(deletedComment._id).populate(
    'commentedBy',
    'meta_data profilePicture emails'
  );
  return populatedComment;
};

const createReplyIntoDB = async (payload: IReply, uId: string) => {
  const user = await UserModel.findOne({ uId });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  const isVerified = user.meta_data?.mobileNumber;
  if (!isVerified) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User is not verified');
  }

  if (payload.replyText) {
    payload.replyText = sanitizeTextField(payload.replyText);
  }
  payload.repliedBy = user._id;
  const replyCreated = await DocReplyModel.create(payload);
  return replyCreated;
};

const updateReplyIntoDB = async (replyId: string, uId: string, text: string) => {
  const user = await UserModel.findOne({ uId });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const userId = user._id;
  const sanitizeText = sanitizeTextField(text);
  const updatedReply = await DocReplyModel.findOneAndUpdate(
    { _id: replyId, repliedBy: userId, isDeleted: false },
    { replyText: sanitizeText },
    { new: true }
  );

  if (!updatedReply) {
    throw new AppError(httpStatus.FORBIDDEN, 'You do not have permission to edit this reply');
  }
  const populatedReply = await DocReplyModel.findById(updatedReply._id).populate(
    'repliedBy',
    'meta_data profilePicture emails'
  );
  return populatedReply;
};

const getRepliesByCommentIdFromDB = async (commentId: string, filters: ICommentReplyFilters) => {
  const { page = 1, limit = 10, sort } = filters;
  const sortValue = sort === 'asc' ? 1 : -1;
  const skip = (page - 1) * limit;

  const [replies, total] = await Promise.all([
    DocReplyModel.find({ commentId, isDeleted: false })
      .populate('repliedBy', 'meta_data profilePicture emails')
      .sort({ createdAt: sortValue })
      .skip(skip)
      .limit(limit),
    DocReplyModel.countDocuments({ commentId, isDeleted: false }),
  ]);
  const hasMore = page * limit < total;
  return {
    meta: {
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit),
      hasMore,
    },
    data: replies,
  };
};

const deleteReplyIntoDB = async (replyId: string, uId: string) => {
  const user = await UserModel.findOne({ uId });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  const userId = user._id;
  const isAdmin = user.roles.includes('admin');

  // Fetch the reply to check ownership and associated doc
  const reply = await DocReplyModel.findOne({ _id: replyId, isDeleted: false });
  if (!reply) {
    throw new AppError(httpStatus.NOT_FOUND, 'Reply not found');
  }

  // Fetch the comment to check ownership and associated doc
  const comment = await DocCommentModel.findOne({ _id: reply.commentId, isDeleted: false });
  if (!comment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Comment not found');
  }

  // Fetch the associated doc to check if user is the author
  const doc = await DocModel.findOne({ _id: comment.docId, isDeleted: false }).lean();
  if (!doc) {
    throw new AppError(httpStatus.NOT_FOUND, 'Associated document not found');
  }

  // Check if the user is either the Responder or the doc's author
  const isResponder = reply.repliedBy.toString() === userId.toString();
  const isAuthor = doc.authorId?.toString() === userId.toString();
  if (!isResponder && !isAuthor && !isAdmin) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not allowed to delete this comment');
  }

  const deletedReply = await DocReplyModel.findOneAndUpdate(
    { _id: replyId },
    { isDeleted: true },
    { new: true }
  );
  return deletedReply;
};

const createBookmarkIntoDB = async (docId: string, uId: string) => {
  const user = await UserModel.findOne({ uId });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  const userId = user._id;

  // Prevent duplicate bookmarks
  const exists = await BookmarkModel.findOne({ docId, userId });
  if (exists) {
    throw new AppError(httpStatus.CONFLICT, 'This document is already bookmarked');
  }

  const created = await BookmarkModel.create({ docId, userId });
  return created;
};

const getBookmarksFromDB = async (docId: string, uId?: string) => {
  const count = await BookmarkModel.countDocuments({ docId: docId });
  let isUserBookmarked = false;
  if (uId) {
    const entry = await BookmarkModel.findOne({ docId, userId: uId });
    isUserBookmarked = !!entry;
  }
  return { count, isUserBookmarked };
};

const deleteBookmarkFromDB = async (docId: string, uId: string) => {
  const user = await UserModel.findOne({ uId });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  const userId = user._id;
  const deleted = await BookmarkModel.findOneAndDelete({ docId, userId });

  if (!deleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Bookmark not found or already deleted');
  }

  return deleted;
};

export const DocServices = {
  createCategoryIntoDB,
  getAllCategoriesFromDB,
  getSingleCategoryDetailsFromDB,
  updateCategoryIntoDB,
  softDeleteCategory,
  permanentDeleteCategoryFromDB,
  createSubcategoryIntoDB,
  getAllSubcategoriesFromDB,
  getSingleSubcategoryDetailsFromDB,
  getSubcategoriesByCategoryIdFromDB,
  updateSubcategoryIntoDB,
  softDeleteSubcategory,
  permanentDeleteSubcategoryFromDB,
  createTagIntoDB,
  updateTagIntoDB,
  getAllTagsFromDB,
  getSingleTagFromDB,
  getDocsByTagFromDB,
  softDeleteTagFromDB,
  createMediaIntoDB,
  listAzureMedia,
  deleteAzureMedia,
  updateAzureMedia,
  softDeleteMediaFromDB,
  updateMediaIntoDB,
  getAllMediaFromDB,
  getSingleMediaFromDB,
  createDocIntoDB,
  createDraftDocIntoDB,
  getAllDocsFromDB,
  getSingleDocDetailsFromDB,
  searchDocsFromDB,
  updateDocIntoDB,
  updateDraftDocIntoDB,
  deleteDocFromDB,
  createCommentIntoDB,
  updateCommentIntoDB,
  getCommentsByDocIdFromDB,
  deleteCommentIntoDB,
  createReplyIntoDB,
  updateReplyIntoDB,
  getRepliesByCommentIdFromDB,
  deleteReplyIntoDB,
  createBookmarkIntoDB,
  getBookmarksFromDB,
  deleteBookmarkFromDB,
};
