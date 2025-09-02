/**
 * Validates MSG91 webhook payload
 * Only validates essential fields: status, mobile, content, templateName
 */
export const validateMSG91WebhookPayload = (payload: Record<string, unknown>) => {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, error: 'Invalid payload structure' };
  }

  // Validate status
  if (!payload.status || typeof payload.status !== 'string') {
    return { isValid: false, error: 'Status is required and must be a string' };
  }

  // Validate mobile
  if (!payload.mobile || typeof payload.mobile !== 'string') {
    return { isValid: false, error: 'Mobile is required and must be a string' };
  }

  // Validate content (required for failed messages)
  if (payload.status === 'failed' && (!payload.content || typeof payload.content !== 'string')) {
    return { isValid: false, error: 'Content is required for failed messages' };
  }

  // Validate templateName (required for failed messages)
  if (
    payload.status === 'failed' &&
    (!payload.templateName || typeof payload.templateName !== 'string')
  ) {
    return { isValid: false, error: 'Template name is required for failed messages' };
  }

  return { isValid: true };
};

/**
 * Parses webhook content string to JSON object
 */
export const parseWebhookContent = (content: string) => {
  try {
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
};

/**
 * Extracts order confirmation data from parsed content
 */
export const extractOrderConfirmationData = (parsedContent: Record<string, unknown>) => {
  try {
    const body1 = parsedContent.body_1 as Record<string, unknown>;
    const body2 = parsedContent.body_2 as Record<string, unknown>;
    const body3 = parsedContent.body_3 as Record<string, unknown>;
    const body4 = parsedContent.body_4 as Record<string, unknown>;

    if (!body1?.text || !body2?.text || !body3?.text || !body4?.text) {
      return null;
    }

    return {
      name: body1.text as string,
      currencySymbol: body2.text as string,
      amount: parseFloat(body3.text as string),
      orderId: body4.text as string,
    };
  } catch (error) {
    return null;
  }
};

/**
 * Extracts unlock contact data from parsed content
 */
export const extractUnlockContactData = (parsedContent: Record<string, unknown>) => {
  try {
    const body1 = parsedContent.body_1 as Record<string, unknown>;
    const body2 = parsedContent.body_2 as Record<string, unknown>;
    const body3 = parsedContent.body_3 as Record<string, unknown>;
    const body4 = parsedContent.body_4 as Record<string, unknown>;

    if (!body1?.text || !body2?.text || !body3?.text || !body4?.text) {
      return null;
    }

    return {
      din: body1.text as string,
      name: body2.text as string,
      mobile: body3.text as string,
      email: body4.text as string,
    };
  } catch (error) {
    return null;
  }
};
