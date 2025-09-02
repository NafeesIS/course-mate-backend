import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { CreditControllers } from './credit.controller';

const router = express.Router();

router.get('/add-bulk-unlock-credit', verifySession(), CreditControllers.addBulkUnlockCredit);
router.get(
  '/add-bulk-unlock-credit-without-mongo-session',
  CreditControllers.addBulkUnlockCreditWithoutMongoSession
);

export const CreditRoutes = router;
