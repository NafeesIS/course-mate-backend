import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { verifyAdmin } from '../../middlewares/verifyAdmin';
import { ApiKeyControllers } from './apiKey.controller';

const router = express.Router();

// Admin only routes
// router.post('/generate', verifySession(), verifyAdmin, ApiKeyControllers.generateApiKey);
router.get('/usage', verifySession(), verifyAdmin, ApiKeyControllers.getApiKeyUsage);
router.post('/deactivate', verifySession(), verifyAdmin, ApiKeyControllers.deactivateApiKey);

// local testing routes
router.post('/generate', ApiKeyControllers.generateApiKey);
// router.get('/usage', ApiKeyControllers.getApiKeyUsage);
// router.post('/deactivate', ApiKeyControllers.deactivateApiKey);

export const ApiKeyRoutes = router;
