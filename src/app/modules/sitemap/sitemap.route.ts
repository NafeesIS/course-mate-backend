import express from 'express';
import { SitemapControllers } from './sitemap.controller';

const router = express.Router();
router.get('/allCompany', SitemapControllers.getAllCompany);
router.get('/countTotalCompany', SitemapControllers.getTotalCompanyCount);

export const SitemapRoutes = router;
