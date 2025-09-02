import express from 'express';
import { ServiceCatalogControllers } from './serviceCatalog.controller';

const router = express.Router();

router.post('/', ServiceCatalogControllers.createService);
router.get('/filter', ServiceCatalogControllers.getServiceByNameFilter);
router.get('/get-all-service-catalog', ServiceCatalogControllers.getAllServiceCatalog);

export const ServiceCatalogRoutes = router;
