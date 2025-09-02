import express from 'express';
import { ZohoCrmControllers } from './zoho.controller';

const router = express.Router();

router.post('/schedule-call', ZohoCrmControllers.scheduleCallIntoZoho); //req call back schedule call in zoho lead
router.post('/create-zoho-lead', ZohoCrmControllers.createZohoLead);
router.get('/get-zoho-lead', ZohoCrmControllers.getZohoLeadDetails);
router.post('/update-lead-inc20-status', ZohoCrmControllers.updateLeadInc20Status);
export const ZohoCrmRoutes = router;
