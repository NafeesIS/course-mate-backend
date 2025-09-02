import express from 'express';
import { InsightsControllers } from './insights.controller';

const router = express.Router();

router.post('/recentSearches', InsightsControllers.createRecentSearches);
router.get('/recentSearches', InsightsControllers.getRecentSearches);
router.get('/popularSearches', InsightsControllers.getPopularSearches);

router.get('/recentlyIncorporated', InsightsControllers.getRecentlyIncorporatedCompanies);

export const InsightsRoutes = router;
