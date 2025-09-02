import express from 'express';
import { PartnerControllers } from './partner.controller';

const router = express.Router();

router.get('/allPartner', PartnerControllers.getAllPartner);
router.get('/partnerInfo', PartnerControllers.getSinglePartner);

export const PartnerRoutes = router;
