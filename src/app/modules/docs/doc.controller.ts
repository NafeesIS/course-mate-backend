import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import { SessionRequest } from 'supertokens-node/framework/express';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ICommentReplyFilters, IFilterOptions, IMedia } from './doc.interface';
import { DocServices } from './doc.service';
import { uploadImageToAzureWithSAS } from './doc.utils';

const createCategory: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const uId = req.session?.getUserId();
  if (!uId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await DocServices.createCategoryIntoDB(req.body, uId);
  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

const getAllCategories: RequestHandler = catchAsync(async (req, res) => {
  const { limit, page, sort, sortBy, searchTerm } = req.query;

  const parsedSort = sort === 'asc' ? 'asc' : 'desc';
  const parsedSortBy = sortBy === 'updatedAt' ? 'updatedAt' : 'createdAt';
  const parsedPage = page ? Number(page) : undefined;
  const parsedLimit = limit ? Number(limit) : undefined;
  const search = typeof searchTerm === 'string' ? searchTerm : undefined;

  const result = await DocServices.getAllCategoriesFromDB(
    parsedSort,
    parsedSortBy,
    parsedPage,
    parsedLimit,
    search
  );
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Categories fetched successfully',
    data: result,
  });
});

const getCategoryDetails: RequestHandler = catchAsync(async (req, res) => {
  const result = await DocServices.getSingleCategoryDetailsFromDB(req.params.id);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category details fetched successfully',
    data: result,
  });
});

const updateCategory: RequestHandler = catchAsync(async (req, res) => {
  const result = await DocServices.updateCategoryIntoDB(req.params.id, req.body);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category updated successfully',
    data: result,
  });
});

const softDeleteCategory: RequestHandler = catchAsync(async (req, res) => {
  const result = await DocServices.softDeleteCategory(req.params.id);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category deleted successfully',
    data: result,
  });
});

const permanentlyDeleteCategory: RequestHandler = catchAsync(async (req, res) => {
  const result = await DocServices.permanentDeleteCategoryFromDB(req.params.id);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category permanently deleted',
    data: result,
  });
});

const createSubcategory: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const uId = req.session?.getUserId();
  if (!uId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await DocServices.createSubcategoryIntoDB(req.body, uId);
  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Subcategory created successfully',
    data: result,
  });
});

const getAllSubcategories: RequestHandler = catchAsync(async (req, res) => {
  const { limit, page, sort, sortBy, searchTerm } = req.query;

  const parsedSort = sort === 'asc' ? 'asc' : 'desc';
  const parsedSortBy = sortBy === 'updatedAt' ? 'updatedAt' : 'createdAt';
  const parsedPage = page ? Number(page) : undefined;
  const parsedLimit = limit ? Number(limit) : undefined;
  const search = typeof searchTerm === 'string' ? searchTerm : undefined;

  const result = await DocServices.getAllSubcategoriesFromDB(
    parsedSort,
    parsedSortBy,
    parsedPage,
    parsedLimit,
    search
  );

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subcategories fetched successfully',
    data: result,
  });
});

const getSubcategoryDetails: RequestHandler = catchAsync(async (req, res) => {
  const result = await DocServices.getSingleSubcategoryDetailsFromDB(req.params.id);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subcategory details fetched successfully',
    data: result,
  });
});

const getSubcategoriesByCategory: RequestHandler = catchAsync(async (req, res) => {
  const { page, limit } = req.query;

  const parsedPage = page ? Number(req.query.page) : undefined;
  const parsedLimit = limit ? Number(req.query.limit) : undefined;
  const result = await DocServices.getSubcategoriesByCategoryIdFromDB(
    req.params.categoryId,
    parsedPage,
    parsedLimit
  );
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subcategories by category fetched successfully',
    data: result,
  });
});

const updateSubcategory: RequestHandler = catchAsync(async (req, res) => {
  if (req.body?.isHomepage !== undefined) {
    req.body.isHomepage =
      req.body.isHomepage === true || req.body.isHomepage === 'true' ? true : false;
  }
  const result = await DocServices.updateSubcategoryIntoDB(req.params.id, req.body);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subcategory updated successfully',
    data: result,
  });
});

const softDeleteSubcategory: RequestHandler = catchAsync(async (req, res) => {
  const result = await DocServices.softDeleteSubcategory(req.params.id);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subcategory deleted successfully',
    data: result,
  });
});

const permanentlyDeleteSubcategory: RequestHandler = catchAsync(async (req, res) => {
  const result = await DocServices.permanentDeleteSubcategoryFromDB(req.params.id);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subcategory permanently deleted',
    data: result,
  });
});

const createTag: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const uId = req.session?.getUserId();
  if (!uId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await DocServices.createTagIntoDB(req.body, uId);
  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Tag created successfully',
    data: result,
  });
});

const updateTag: RequestHandler = catchAsync(async (req, res) => {
  const result = await DocServices.updateTagIntoDB(req.params.id, req.body);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tag updated successfully',
    data: result,
  });
});

const getAllTags: RequestHandler = catchAsync(async (req, res) => {
  const { limit, page, sort, sortBy, searchTerm } = req.query;

  const parsedSort = sort === 'asc' ? 'asc' : 'desc';
  const parsedSortBy = sortBy === 'updatedAt' ? 'updatedAt' : 'createdAt';
  const parsedPage = page ? Number(page) : undefined;
  const parsedLimit = limit ? Number(limit) : undefined;
  const search = typeof searchTerm === 'string' ? searchTerm : undefined;

  const result = await DocServices.getAllTagsFromDB(
    parsedSort,
    parsedSortBy,
    parsedPage,
    parsedLimit,
    search
  );

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tags fetched successfully',
    data: result,
  });
});

const getSingleTagDetails: RequestHandler = catchAsync(async (req, res) => {
  const result = await DocServices.getSingleTagFromDB(req.params.id);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tag details fetched successfully',
    data: result,
  });
});

const getDocsByTag: RequestHandler = catchAsync(async (req, res) => {
  const tagId = req.params.tagId;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;

  const result = await DocServices.getDocsByTagFromDB(tagId, page, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Docs fetched by tag successfully',
    data: result,
  });
});

const softDeleteTag: RequestHandler = catchAsync(async (req, res) => {
  const result = await DocServices.softDeleteTagFromDB(req.params.id);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tag deleted successfully',
    data: result,
  });
});

const createMedia: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const uId = req.session?.getUserId();
  if (!uId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }
  let imageUrl: string;
  if (req.body.url) {
    imageUrl = req.body.url;
  } else if (req.file) {
    const allowedTypes = ['image', 'jpeg', 'video', 'mp4'];
    const fileType = req.file.mimetype.split('/')[0];
    if (!allowedTypes.includes(fileType)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Only image or video files are allowed');
    }

    imageUrl = await uploadImageToAzureWithSAS(req.file);
  } else {
    throw new AppError(httpStatus.BAD_REQUEST, 'Provide either media file or URL');
  }

  const payload: Partial<IMedia> = {
    url: imageUrl,
    title: req.body.title || req.file?.originalname || 'Untitled Media',
    type: req.body.type || req.file?.mimetype?.split('/')[0] || 'image',
  };

  const result = await DocServices.createMediaIntoDB(payload, uId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Media created successfully',
    data: result,
  });
});

const getMedia: RequestHandler = catchAsync(async (req, res) => {
  // Optional query params
  const prefix = typeof req.query.prefix === 'string' ? req.query.prefix : undefined;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;
  const continuationToken =
    typeof req.query.continuationToken === 'string' ? req.query.continuationToken : undefined;

  const withSas = req.query.sas === 'true'; // ?sas=true to return SAS URLs
  const sasTtlMinutes = req.query.sasTtl ? Number(req.query.sasTtl) : undefined;

  // Basic validation
  if (Number.isNaN(pageSize as number)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid pageSize');
  }
  if (Number.isNaN(sasTtlMinutes as number)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid sasTtl');
  }

  const result = await DocServices.listAzureMedia({
    prefix,
    pageSize,
    continuationToken,
    withSas,
    sasTtlMinutes,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Media fetched successfully',
    data: result,
  });
});

const deleteAzureMedia = catchAsync(async (req, res) => {
  const name =
    (typeof req.body?.name === 'string' && req.body.name) ||
    (typeof req.query?.name === 'string' && req.query.name);

  if (!name) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing "name" of the blob to delete');
  }

  await DocServices.deleteAzureMedia(name);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Media deleted successfully',
    data: { name },
  });
});

const updateAzureMedia = catchAsync(async (req, res) => {
  const { name, newName, metadata, httpHeaders, ifMatch } = req.body ?? {};
  if (!name || typeof name !== 'string') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing "name"');
  }
  if (newName && typeof newName !== 'string') {
    throw new AppError(httpStatus.BAD_REQUEST, '"newName" must be a string');
  }
  if (metadata && typeof metadata !== 'object') {
    throw new AppError(httpStatus.BAD_REQUEST, '"metadata" must be an object');
  }
  if (httpHeaders && typeof httpHeaders !== 'object') {
    throw new AppError(httpStatus.BAD_REQUEST, '"httpHeaders" must be an object');
  }

  const result = await DocServices.updateAzureMedia({
    name,
    newName,
    metadata,
    httpHeaders,
    ifMatch,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Media updated successfully',
    data: result,
  });
});

const updateMedia: RequestHandler = catchAsync(async (req, res) => {
  const result = await DocServices.updateMediaIntoDB(req.params.id, req.body);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Media updated successfully',
    data: result,
  });
});

const getAllMedia: RequestHandler = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await DocServices.getAllMediaFromDB(page, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Media fetched successfully',
    data: result,
  });
});

const getSingleMediaDetails: RequestHandler = catchAsync(async (req, res) => {
  const result = await DocServices.getSingleMediaFromDB(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Media details fetched successfully',
    data: result,
  });
});

const softDeleteMedia: RequestHandler = catchAsync(async (req, res) => {
  const result = await DocServices.softDeleteMediaFromDB(req.params.id);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Media deleted successfully',
    data: result,
  });
});

const createDoc: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const uId = req.session?.getUserId();
  if (!uId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await DocServices.createDocIntoDB(req.body, uId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Doc created successfully',
    data: result,
  });
});

const createDraftDoc: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const uId = req.session?.getUserId();
  if (!uId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await DocServices.createDraftDocIntoDB(req.body, uId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Draft Doc created successfully',
    data: result,
  });
});

const getAllDocs: RequestHandler = catchAsync(async (req, res) => {
  const filters: IFilterOptions = {
    categoryId: req.query.categoryId as string,
    subcategoryId: req.query.subcategoryId as string,
    status:
      req.query.status === 'all' ? undefined : req.query.status === 'draft' ? 'draft' : 'published',
    tagId: req.query.tagId as string,
    isFeatured:
      req.query.isFeatured === 'true' ? true : req.query.isFeatured === 'false' ? false : undefined,
    isHomepage:
      req.query.isHomepage === 'true' ? true : req.query.isHomepage === 'false' ? false : undefined,
    from: req.query.from as string,
    to: req.query.to as string,
    sort: req.query.sort === 'asc' ? 'asc' : 'desc', // default to 'desc'(new to old)
    sortBy: req.query.sortBy === 'updatedAt' ? 'updatedAt' : 'createdAt',
    searchTerm:
      typeof req.query.searchTerm === 'string' ? (req.query.searchTerm as string) : undefined,
    timezone: req.query.timezone as string,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 10,
  };

  const result = await DocServices.getAllDocsFromDB(filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Docs fetched successfully',
    data: result,
  });
});

const getSingleDocDetails: RequestHandler = catchAsync(async (req, res) => {
  const result = await DocServices.getSingleDocDetailsFromDB(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Doc details fetched successfully',
    data: result,
  });
});

const getSearchedDocs: RequestHandler = catchAsync(async (req, res) => {
  const searchText = req.query.searchTerm as string;
  if (!searchText) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Search term is required');
  }
  const data = await DocServices.searchDocsFromDB(searchText);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Searched Docs fetched successfully',
    data,
  });
});

const updateDraftDoc: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const uId = req.session?.getUserId();
  if (!uId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await DocServices.updateDraftDocIntoDB(req.params.id, req.body, uId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Draft Doc created successfully',
    data: result,
  });
});

const updateDoc: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const uId = req.session?.getUserId();
  if (!uId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await DocServices.updateDocIntoDB(req.params.id, req.body, uId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Doc updated successfully',
    data: result,
  });
});

const deleteDoc: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const uId = req.session?.getUserId();
  if (!uId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await DocServices.deleteDocFromDB(req.params.id, uId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Doc deleted successfully',
    data: result,
  });
});

const createComment: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const uId = req.session?.getUserId();
  if (!uId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  const docId = req.params.docId;
  const result = await DocServices.createCommentIntoDB(req.body, uId, docId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Comment added successfully',
    data: result,
  });
});

const updateComment: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const uId = req.session?.getUserId();

  if (!uId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  const result = await DocServices.updateCommentIntoDB(
    req.params.commentId,
    uId,
    req.body.commentText
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Comment updated successfully',
    data: result,
  });
});

const deleteComment: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const uId = req.session?.getUserId();
  if (!uId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  const result = await DocServices.deleteCommentIntoDB(req.params.commentId, uId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Comment deleted successfully',
    data: result,
  });
});

const getCommentsByDocId: RequestHandler = catchAsync(async (req, res) => {
  const filters: ICommentReplyFilters = {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 10,
    sort: req.query.sort === 'asc' ? 'asc' : 'desc', // default to 'desc'(new to old)
  };
  const result = await DocServices.getCommentsByDocIdFromDB(req.params.docId, filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Comments fetched successfully',
    data: result,
  });
});

const createReply: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const uId = req.session?.getUserId();
  if (!uId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  const result = await DocServices.createReplyIntoDB(req.body, uId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Reply added successfully',
    data: result,
  });
});

const updateReply: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const uId = req.session?.getUserId();
  if (!uId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  const result = await DocServices.updateReplyIntoDB(req.params.replyId, uId, req.body.replyText);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reply updated successfully',
    data: result,
  });
});

const getRepliesByCommentId: RequestHandler = catchAsync(async (req, res) => {
  const filters: ICommentReplyFilters = {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 5,
    sort: req.query.sort === 'asc' ? 'asc' : 'desc', // default to 'desc'(new to old)
  };
  const result = await DocServices.getRepliesByCommentIdFromDB(req.params.commentId, filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Replies fetched successfully',
    data: result,
  });
});

const deleteReply: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const uId = req.session?.getUserId();
  if (!uId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  const result = await DocServices.deleteReplyIntoDB(req.params.replyId, uId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reply deleted successfully',
    data: result,
  });
});

const createBookmark: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const uId = req.session?.getUserId();
  if (!uId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  const result = await DocServices.createBookmarkIntoDB(req.params.docId, uId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Bookmark created successfully',
    data: result,
  });
});

const getBookmarks: RequestHandler = catchAsync(async (req, res) => {
  const uId = req.query.userId ? (req.query.userId as string) : undefined;
  const result = await DocServices.getBookmarksFromDB(req.params.docId, uId);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bookmarks fetched successfully',
    data: result,
  });
});

const deleteBookmark: RequestHandler = catchAsync(async (req: SessionRequest, res) => {
  const uId = req.session?.getUserId();
  if (!uId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  const result = await DocServices.deleteBookmarkFromDB(req.params.docId, uId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bookmark deleted successfully',
    data: result,
  });
});

export const DocControllers = {
  createCategory,
  getAllCategories,
  getCategoryDetails,
  updateCategory,
  softDeleteCategory,
  createSubcategory,
  getAllSubcategories,
  getSubcategoryDetails,
  getSubcategoriesByCategory,
  updateSubcategory,
  softDeleteSubcategory,
  permanentlyDeleteCategory,
  permanentlyDeleteSubcategory,
  createTag,
  updateTag,
  getAllTags,
  getSingleTagDetails,
  getDocsByTag,
  softDeleteTag,
  createDoc,
  createDraftDoc,
  getAllDocs,
  getSingleDocDetails,
  getSearchedDocs,
  updateDoc,
  updateDraftDoc,
  deleteDoc,
  createMedia,
  deleteAzureMedia,
  updateAzureMedia,
  getMedia,
  updateMedia,
  softDeleteMedia,
  getAllMedia,
  getSingleMediaDetails,
  createComment,
  updateComment,
  getCommentsByDocId,
  deleteComment,
  createReply,
  updateReply,
  getRepliesByCommentId,
  deleteReply,
  createBookmark,
  getBookmarks,
  deleteBookmark,
};
