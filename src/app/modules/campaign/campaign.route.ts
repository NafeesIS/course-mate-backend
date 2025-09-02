import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { verifyAdmin } from '../../middlewares/verifyAdmin';
import { CampaignController } from './campaign.controller';

const router = express.Router();
router.get('/', verifySession(), verifyAdmin, CampaignController.getCampaignsWithPagination);
router.get(
  '/campaign-tracker',
  verifySession(),
  verifyAdmin,
  CampaignController.getCampaignsTrackerForDashboard
);
router.get(
  '/campaign-overview',
  verifySession(),
  verifyAdmin,
  CampaignController.getCampaignOverviewStatsController
);
router.get(
  '/campaign-report',
  verifySession(),
  verifyAdmin,
  CampaignController.getCampaignReportController
);
export const CampaignRoutes = router;
