import express from 'express';
import multer from 'multer';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import validateRequest from '../../middlewares/validateRequest';
import { verifyAdmin } from '../../middlewares/verifyAdmin';
import { DocControllers } from './doc.controller';
import {
  createCategoryValidationSchema,
  createCommentValidationSchema,
  createDocValidationSchema,
  createDraftDocValidationSchema,
  createMediaValidationSchema,
  createReplyValidationSchema,
  createSubcategoryValidationSchema,
  createTagValidationSchema,
  updateCategoryValidationSchema,
  updateCommentValidationSchema,
  updateDocValidationSchema,
  updateMediaValidationSchema,
  updateReplyValidationSchema,
  updateSubcategoryValidationSchema,
  updateTagValidationSchema,
} from './doc.validation';

const router = express.Router();
const upload = multer({
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB
});

//categories api
router.post(
  '/create-category',
  verifySession(),
  verifyAdmin,
  validateRequest(createCategoryValidationSchema),
  DocControllers.createCategory
);
router.get('/category', DocControllers.getAllCategories);
router.get('/category/:id', DocControllers.getCategoryDetails);
router.patch(
  '/update-category/:id',
  verifySession(),
  verifyAdmin,
  validateRequest(updateCategoryValidationSchema),
  DocControllers.updateCategory
);
router.delete(
  '/soft-delete-category/:id',
  verifySession(),
  verifyAdmin,
  DocControllers.softDeleteCategory
);
router.delete(
  '/permanent-delete-category/:id',
  verifySession(),
  verifyAdmin,
  DocControllers.permanentlyDeleteCategory
);

//subcategories api
router.post(
  '/create-subcategory',
  verifySession(),
  verifyAdmin,
  validateRequest(createSubcategoryValidationSchema),
  DocControllers.createSubcategory
);
router.get('/subcategory', DocControllers.getAllSubcategories);
router.get('/subcategory/:id', DocControllers.getSubcategoryDetails);
router.get('/subcategory/category/:categoryId', DocControllers.getSubcategoriesByCategory);
router.patch(
  '/update-subcategory/:id',
  verifySession(),
  verifyAdmin,
  validateRequest(updateSubcategoryValidationSchema),
  DocControllers.updateSubcategory
);
router.delete(
  '/soft-delete-subcategory/:id',
  verifySession(),
  verifyAdmin,
  DocControllers.softDeleteSubcategory
);
router.delete(
  '/permanent-delete-subcategory/:id',
  verifySession(),
  verifyAdmin,
  DocControllers.permanentlyDeleteSubcategory
);

//tags api
router.post(
  '/create-tag',
  verifySession(),
  verifyAdmin,
  validateRequest(createTagValidationSchema),
  DocControllers.createTag
);
router.get('/tag', DocControllers.getAllTags);
router.get('/tag/:id', verifySession(), DocControllers.getSingleTagDetails);
router.get('/by-tag/:tagId', DocControllers.getDocsByTag);
router.patch(
  '/update-tag/:id',
  verifySession(),
  verifyAdmin,
  validateRequest(updateTagValidationSchema),
  DocControllers.updateTag
);
router.delete('/soft-delete-tag/:id', verifySession(), verifyAdmin, DocControllers.softDeleteTag);

//Media Api
router.get('/media', DocControllers.getMedia);
router.post(
  '/create-media',
  verifySession(),
  verifyAdmin,
  validateRequest(createMediaValidationSchema),
  upload.single('file'),
  DocControllers.createMedia
);
router.get('/all-media', DocControllers.getAllMedia);
router.get('/media/:id', DocControllers.getSingleMediaDetails);
router.patch('/update-azure-media', DocControllers.updateAzureMedia);
router.delete('/delete-azure-media', DocControllers.deleteAzureMedia);
router.patch(
  '/update-media/:id',
  validateRequest(updateMediaValidationSchema),
  DocControllers.updateMedia
);
router.delete('/soft-delete-media/:id', verifySession(), DocControllers.softDeleteMedia);

//doc api
router.get('/', DocControllers.getAllDocs);
router.get('/search', DocControllers.getSearchedDocs);
router.get('/:id', DocControllers.getSingleDocDetails);
router.post(
  '/create-draft-doc',
  verifySession(),
  verifyAdmin,
  validateRequest(createDraftDocValidationSchema),
  DocControllers.createDraftDoc
);
router.patch(
  '/update-draft-doc/:id',
  verifySession(),
  verifyAdmin,
  validateRequest(createDraftDocValidationSchema),
  DocControllers.updateDraftDoc
);
router.post(
  '/create-doc',
  verifySession(),
  verifyAdmin,
  validateRequest(createDocValidationSchema),
  DocControllers.createDoc
);
router.patch(
  '/update-doc/:id',
  verifySession(),
  verifyAdmin,
  validateRequest(updateDocValidationSchema),
  DocControllers.updateDoc
);
router.delete('/delete-doc/:id', verifySession(), verifyAdmin, DocControllers.deleteDoc);

// Comment & Reply api
router.get('/comments/:docId', DocControllers.getCommentsByDocId);
router.post(
  '/create-comment/:docId',
  verifySession(),
  validateRequest(createCommentValidationSchema),
  DocControllers.createComment
);
router.patch(
  '/update-comment/:commentId',
  verifySession(),
  validateRequest(updateCommentValidationSchema),
  DocControllers.updateComment
);
router.delete('/delete-comment/:commentId', verifySession(), DocControllers.deleteComment);

router.post(
  '/create-reply',
  verifySession(),
  validateRequest(createReplyValidationSchema),
  DocControllers.createReply
);
router.get('/replies/:commentId', DocControllers.getRepliesByCommentId);
router.patch(
  '/update-reply/:replyId',
  verifySession(),
  validateRequest(updateReplyValidationSchema),
  DocControllers.updateReply
);
router.delete('/delete-reply/:replyId', verifySession(), DocControllers.deleteReply);

// Bookmark Api
router.get('/bookmarks/:docId', DocControllers.getBookmarks);
router.post('/create-bookmark/:docId', verifySession(), DocControllers.createBookmark);
router.delete('/delete-bookmark/:docId', verifySession(), DocControllers.deleteBookmark);

//Export router
export const DocRoutes = router;
