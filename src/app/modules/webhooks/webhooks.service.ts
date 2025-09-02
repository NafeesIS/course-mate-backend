import {
  sendConfirmationSMS,
  sendUnlockContactDetailsSMS,
} from '../../utils/notification/notification';
import {
  extractOrderConfirmationData,
  extractUnlockContactData,
  parseWebhookContent,
  validateMSG91WebhookPayload,
} from './utils/webhookValidation';

/**
 * Processes MSG91 WhatsApp webhook and handles fallback SMS when WhatsApp delivery fails
 */
const msg91WhatsappWebhook = async (payload: Record<string, unknown>) => {
  console.log('MSG91 WhatsApp webhook received:', payload.status);

  try {
    // Validate payload
    const validation = validateMSG91WebhookPayload(payload);
    if (!validation.isValid) {
      console.log('Invalid webhook payload:', validation.error);
      return {
        success: false,
        message: validation.error || 'Invalid webhook payload',
        error: validation.error,
      };
    }

    const status = payload.status as string;
    const mobile = payload.mobile as string;
    const content = payload.content as string;
    const templateName = payload.templateName as string;

    // Only process failed messages for fallback
    if (status !== 'failed') {
      console.log('No action required for non-failed message');
      return {
        success: true,
        message: 'No action required for non-failed message',
        data: { status, templateName },
      };
    }

    // Validate content exists
    if (!content) {
      console.log('Content is required for failed message processing');
      return {
        success: false,
        message: 'Content is required for failed message processing',
        error: 'Missing content',
      };
    }

    // Parse content
    const parsedContent = parseWebhookContent(content);
    if (!parsedContent) {
      console.log('Failed to parse webhook content');
      return {
        success: false,
        message: 'Failed to parse webhook content',
        error: 'Invalid content format',
      };
    }

    let fallbackResult: unknown = null;

    // Process based on template type
    switch (templateName) {
      case 'order_confirmation_v1': {
        const orderData = extractOrderConfirmationData(parsedContent);
        if (!orderData) {
          console.log('Failed to extract order confirmation data');
          return {
            success: false,
            message: 'Failed to extract order confirmation data',
            error: 'Invalid order confirmation data format',
          };
        }

        fallbackResult = await sendConfirmationSMS(
          mobile,
          orderData.name,
          orderData.currencySymbol,
          orderData.amount,
          orderData.orderId
        );
        break;
      }

      case 'unlock_contact_intimation_v1': {
        const contactData = extractUnlockContactData(parsedContent);
        if (!contactData) {
          console.log('Failed to extract unlock contact data');
          return {
            success: false,
            message: 'Failed to extract unlock contact data',
            error: 'Invalid unlock contact data format',
          };
        }

        fallbackResult = await sendUnlockContactDetailsSMS(
          mobile,
          contactData.din,
          contactData.name,
          contactData.mobile,
          contactData.email
        );
        break;
      }

      default:
        console.log(`Template ${templateName} not supported for fallback`);
        return {
          success: false,
          message: `Template ${templateName} not supported for fallback`,
          error: 'Unsupported template',
        };
    }

    // Check if fallback was successful
    if (!fallbackResult) {
      console.log('SMS fallback failed');
      return {
        success: false,
        message: 'SMS fallback failed',
        error: 'SMS service returned null response',
      };
    }

    return {
      success: true,
      message: 'Fallback SMS sent successfully',
      data: {
        originalStatus: status,
        templateName,
        mobile,
        fallbackResult,
      },
      fallbackSent: true,
    };
  } catch (error) {
    console.error('Error processing MSG91 webhook:', error);
    return {
      success: false,
      message: 'Internal error processing webhook',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const WebhooksServices = {
  msg91WhatsappWebhook,
};
