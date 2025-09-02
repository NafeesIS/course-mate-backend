import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { UnlockContactControllers } from './unlockContact.controller';

const router = express.Router();

router.post('/bulk-credit', verifySession(), UnlockContactControllers.unlockContactWithCredit);
// router.post('/bulk-credit', UnlockContactControllers.unlockContactWithCredit);

// router.post(
//   '/user-unlocked-contacts',
//   verifySession(),
//   UnlockContactControllers.getUserCreditsAndUnlockedContacts
// );
router.get(
  '/user-unlocked-contacts',
  verifySession(),
  UnlockContactControllers.getUserCreditsAndUnlockedContacts
);
// router.get('/user-credits', UnlockContactControllers.getUserCreditsAndUnlockedContacts);

export const UnlockContactRoutes = router;
