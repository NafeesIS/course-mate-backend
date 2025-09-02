// MSG91 Webhook Constants
export const MSG91_WEBHOOK_CONSTANTS = {
  // Template Names
  TEMPLATES: {
    ORDER_CONFIRMATION: 'order_confirmation_v1',
    UNLOCK_CONTACT_INTIMATION: 'unlock_contact_intimation_v1',
  },

  // Status Types
  STATUS: {
    FAILED: 'failed',
    DELIVERED: 'delivered',
    READ: 'read',
    SENT: 'sent',
    PENDING: 'pending',
  },

  // Error Messages
  ERRORS: {
    INVALID_PAYLOAD: 'Invalid webhook payload',
    MISSING_REQUIRED_FIELDS: 'Missing required fields in webhook payload',
    INVALID_CONTENT_FORMAT: 'Invalid content format in webhook payload',
    TEMPLATE_NOT_SUPPORTED: 'Template not supported for fallback processing',
    FALLBACK_FAILED: 'Fallback SMS sending failed',
    CONTENT_PARSING_FAILED: 'Failed to parse content from webhook payload',
  },

  // Success Messages
  SUCCESS: {
    WEBHOOK_PROCESSED: 'Webhook processed successfully',
    FALLBACK_SENT: 'Fallback SMS sent successfully',
    NO_ACTION_REQUIRED: 'No action required for this webhook',
  },

  // Log Messages
  LOGS: {
    WEBHOOK_RECEIVED: 'MSG91 webhook received',
    PROCESSING_STARTED: 'Processing MSG91 webhook',
    FALLBACK_TRIGGERED: 'Fallback SMS triggered for failed WhatsApp message',
    PROCESSING_COMPLETED: 'MSG91 webhook processing completed',
  },
} as const;
