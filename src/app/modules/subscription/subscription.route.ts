import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import validateRequest from '../../middlewares/validateRequest';
import { verifyAdmin } from '../../middlewares/verifyAdmin';
import { SubscriptionControllers } from './subscription.controller';
import { SubscriptionValidations } from './subscription.validation';

const router = express.Router();

router.post(
  '/create-subscription',
  validateRequest(SubscriptionValidations.createSubscriptionValidationSchema),
  SubscriptionControllers.createSubscription
);
router.get(
  '/get-subscription-details/:subscriptionId',
  SubscriptionControllers.getSubscriptionDetails
);

router.get('/all-subscriber-emails', SubscriptionControllers.getAllSubscriberEmails);

// ==== admin dashboard routes ====
router.get('/admin/subscriptions', SubscriptionControllers.getAllSubscriptionDetails);

// ==== user dashboard routes ====
// get subscription details of a user by his subscription id list
router.post(
  '/subscription-details',
  verifySession(),
  validateRequest(SubscriptionValidations.getUserSubscriptionsByIdsSchema),
  SubscriptionControllers.getUserSubscriptionsByIds
);
// get new company alert email history of user
router.get(
  '/nca-email-history',
  verifySession(),
  validateRequest(SubscriptionValidations.getEmailHistoryByUserIdSchema),
  SubscriptionControllers.getEmailHistoryByUserId
);

router.get(
  '/nca-email-history-admin',
  verifySession(),
  verifyAdmin,
  validateRequest(SubscriptionValidations.getEmailHistoryByUserIdSchema),
  SubscriptionControllers.getEmailHistoryForAdmin
);

export const SubscriptionRoutes = router;
