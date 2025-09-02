import express from 'express';
import { MailchimpControllers } from './mailchimp.controller';

const router = express.Router();

// Mailchimp routes
router.get('/ping', MailchimpControllers.pingHandler);
router.post('/user', MailchimpControllers.addOrUpdateUserToAudienceHandler);

export const MailchimpRoutes = router;
