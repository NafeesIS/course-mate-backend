import express from 'express';
import multer from 'multer';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { verifyAdmin } from '../../middlewares/verifyAdmin';
import { UserController } from './user.controller';

const router = express.Router();
const upload = multer({
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB
});
router.get('/', UserController.getUsersWithPagination);
router.get('/user-info', verifySession(), UserController.getUserInfo);
router.get('/:userId', verifySession(), verifyAdmin, UserController.getUserById);
router.post('/search-user', UserController.searchUserByEmailOrPhone);
router.post('/update-user-info', verifySession(), UserController.updateUserInfo);
router.patch(
  '/update-admin-user-info',
  verifySession(),
  verifyAdmin,
  upload.single('file'),
  UserController.updateAdminAuthorMetaData
);
router.post('/add-billing-details', verifySession(), UserController.addBillingDetails);
router.post('/update-billing-details', verifySession(), UserController.updateBillingDetails);
router.get(
  '/get-default-billing-details',
  verifySession(),
  UserController.getDefaultBillingDetails
);
router.delete(
  '/delete-billing-details/:_billingDetailsId',
  verifySession(),
  UserController.deleteBillingDetails
);
export const UserRoutes = router;
