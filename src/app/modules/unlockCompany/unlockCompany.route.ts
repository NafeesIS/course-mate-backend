import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { verifyAdmin } from '../../middlewares/verifyAdmin';
import { UnlockCompanyControllers } from './unlockCompany.controller';

const router = express.Router();

router.post('/', verifySession(), UnlockCompanyControllers.unlockCompanyWithCredit);

// router.post(
//   '/user-unlocked-contacts',
//   verifySession(),
//   UnlockContactControllers.getUserCreditsAndUnlockedContacts
// );
router.post(
  '/user-unlocked-companies',
  verifySession(),
  UnlockCompanyControllers.getUserCreditsAndUnlockedCompany
);

router.post(
  '/admin/all-unlocked-companies',
  verifySession(),
  verifyAdmin,
  UnlockCompanyControllers.getAllUnlockedCompanies
);
// router.get('/user-credits', UnlockContactControllers.getUserCreditsAndUnlockedContacts);

export const UnlockCompanyRoutes = router;
