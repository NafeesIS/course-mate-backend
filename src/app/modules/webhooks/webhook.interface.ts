// MSG91 Webhook Interfaces
export interface IMSG91WebhookPayload {
  // Core fields
  status: 'delivered' | 'failed' | 'read' | 'sent' | 'pending';
  mobile: string;
  content?: string;
  templateName?: string;

  // MSG91 specific fields
  CRQID?: string;
  companyId?: string;
  requestedAt?: string;
  requestId?: string;
  failureReason?: string;
  uuid?: string;
  integratedNumber?: string;
  messageType?: string;
  direction?: string;
  templateLanguage?: string;
  replyMsgId?: string;
  accountManagerEmailId?: string;
  oneApiRequestId?: string;
  emailId?: string;
  conversationExpTimestamp?: string;
  moengageMsgId?: string;
  webengageMsgId?: string;
  clevertapMsgId?: string;
  telecomCircle?: string;
  circleDescription?: string;
  customerName?: string;
  contentType?: string;
  text?: string;
  latitude?: string;
  longitude?: string;
  caption?: string;
  filename?: string;
  url?: string;
  button?: string;
  contacts?: string;
  reaction?: string;
  interactive?: string;
  messages?: string;
  price?: string;
  origin?: string;
  statusUpdatedAt?: string;

  // Legacy fields for backward compatibility
  messageId?: string;
  timestamp?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface IMSG91ContentBody {
  text?: string;
  type?: string;
}

export interface IMSG91Content {
  body_1?: IMSG91ContentBody;
  body_2?: IMSG91ContentBody;
  body_3?: IMSG91ContentBody;
  body_4?: IMSG91ContentBody;
}

export interface IOrderConfirmationData {
  name: string;
  currencySymbol: string;
  amount: number;
  orderId: string;
}

export interface IUnlockContactData {
  din: string;
  name: string;
  mobile: string;
  email: string;
}

export interface IWebhookProcessingResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
  fallbackSent?: boolean;
}
