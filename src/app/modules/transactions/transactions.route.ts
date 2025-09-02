import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { verifyAdmin } from '../../middlewares/verifyAdmin';
import { TransactionsControllers } from './transactions.controller';

const router = express.Router();

router.get(
  '/',
  verifySession(),
  verifyAdmin,
  TransactionsControllers.getTransactionsWithPagination
);

router.post('/create-order', TransactionsControllers.createOrder);

router.post(
  '/create-bulk-director-data-coupon',
  TransactionsControllers.createBulkDirectorDataCouponCode
);

router.get('/verify-transaction/:orderId', TransactionsControllers.verifyTransactionManually);

export const TransactionsRoute = router;
