import express from 'express';
import { WebhooksControllers } from './webhooks.controller';

const router = express.Router();

// MSG91 WhatsApp Webhook - handles delivery status and fallback SMS
router.post('/msg91-whatsapp-status', WebhooksControllers.msg91WhatsappWebhook);

export const WebhooksRoutes = router;
