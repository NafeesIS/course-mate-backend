import { Types } from 'mongoose';
import { TServiceType } from '../serviceCatalog/serviceCatalog.interface';
import { IBillingDetails } from '../user/user.interface';

export type TOrderItem = {
  serviceId: Types.ObjectId;
  serviceName: string;
  serviceType: TServiceType;
  quantity: number;
  price: number;
  currency: string;
  customAttributes?: {
    // Subscription-specific attributes
    plan?: 'monthly' | 'quarterly' | 'annually' | 'trial'; // For subscription services
    options?: string[]; // Array for additional options selected (optional)
    includedStates?: string[]; // For state-specific subscription services
    zone?: string[]; // Selected zone for zonal pricing services

    // Director Unlock-specific attributes
    bulkUnlockCredits?: number; // Number of credits for bulk director unlock

    // Business services type attributes
    package?: 'Starter' | 'Standard' | 'Elite';
    registeredState?: string;

    companyUnlockCredits?: number; // Number of credits for company unlock
    companyId?: string; // Company ID for single company unlock

    // VPD Unlock
    companyName?: string;
    // [key: string]: any; // Allow additional attributes for future flexibility
  };
};

export type TCoupon = {
  code: string;
  type: 'percentage' | 'flat';
  value: number;
};
// package?: 'Starter' | 'Standard' | 'Elite';
// plan?: 'monthly' | 'quarterly' | 'annually';
// options?: string[]; // Array of option selected options
// includedStates?: string[];

export type TOrder = {
  userId: Types.ObjectId; // Allow for both ObjectId and populated User
  userName: string;
  userEmail: string;
  userContact: string;
  items: TOrderItem[]; // Array of items in the order
  value: number;
  gst: number;
  gstNumber: string;
  status: 'CREATED' | 'PENDING' | 'PAID' | 'FAILED' | 'UNKNOWN';
  paymentId: string | null; // Payment ID from Cashfree
  orderId: string; // Order ID from Cashfree or Razorpay or system generated
  currency: string;
  coupon: TCoupon | null;
  discount_amount: number;
  isProcessed: boolean;
  isZohoInvoiceCreated: boolean;
  invoiceNumber?: string;
  invoiceDate?: Date;
  billingDetails?: IBillingDetails;
  returnUrl?: string; // Return URL from Cashfree
  createdAt: Date;
  updatedAt: Date;
};
