import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { verifyAdmin } from '../../middlewares/verifyAdmin';
import { verifyApiKey } from '../../middlewares/verifyApiKey';
import { verifyPaymentMiddleware } from '../../middlewares/verifyPaymentMiddleware';
import { DirectorControllers } from './director.controller';

const router = express.Router();

router.get('/suggestions', DirectorControllers.getDirectorSuggestions);
router.get('/advanceSearch', DirectorControllers.getDirectorAdvanceSearch);
router.get('/searchFacets', DirectorControllers.getDirectorAdvanceSearchFacets);

router.get('/directorInfo', DirectorControllers.getSingleDirectorDetails);
router.get('/associatedDirectors', DirectorControllers.getAssociatedDirectors);

router.get('/checkContactStatus', DirectorControllers.checkContactStatus);
router.post(
  '/getPaidContactDetails',
  verifyPaymentMiddleware,
  DirectorControllers.getPaidContactDetails
);

router.get('/triggerContactUpdater', DirectorControllers.triggerContactUpdater);

// Admin only routes: masking and unmasking contact info for directors
router.post('/hideContactInfo', verifySession(), verifyAdmin, DirectorControllers.hideContactInfo);
router.post('/showContactInfo', verifySession(), verifyAdmin, DirectorControllers.showContactInfo);
router.get(
  '/contactInfoStatus',
  verifySession(),
  verifyAdmin,
  DirectorControllers.getDirectorContactInfoStatus
);

// 3rd Party API route with API key authentication
router.get(
  '/getDirectorContactDetails',
  verifyApiKey,
  DirectorControllers.getDirectorContactDetails
);

export const DirectorRoutes = router;
