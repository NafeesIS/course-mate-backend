import express from 'express';
import { LeadControllers } from './leadGen.controller';

const router = express.Router();

router.post('/addLead', LeadControllers.createLead);
router.get('/getLeads', LeadControllers.getLeads);
router.get('/getLeadsTest', LeadControllers.getMarketingLeads);
router.get('/getLeads/:id', LeadControllers.getLeadById);
router.patch('/updateLeads/:id', LeadControllers.updateLeadById);
router.get('/unsubscribe', LeadControllers.createUnsubscribeEmail);

export const LeadGenRoutes = router;
