import { model, Schema } from 'mongoose';
import { IBillingDetails } from '../user/user.interface';
import { paymentStatus } from './order.constant';
import { TOrder, TOrderItem } from './order.interface';

const orderItemSchema = new Schema<TOrderItem>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'ServiceCatalog', required: true },
    serviceName: { type: String, required: true },
    serviceType: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    // plan: { type: String, enum: ['monthly', 'quarterly', 'annually'], default: null },
    // options: { type: [String], default: [] },
    // includedStates: { type: [String], default: [] },
    customAttributes: { type: Object, default: null },
  },
  { _id: false }
);

const billingDetailsSchema = new Schema<IBillingDetails>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    address: { type: String },
    city: { type: String },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    billingType: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<TOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: String, required: true },
    items: [orderItemSchema], // Array of items
    value: { type: Number, required: true },
    gst: { type: Number, required: true, default: 0 },
    gstNumber: { type: String, default: null },
    status: { type: String, enum: paymentStatus, default: 'CREATED' },
    paymentId: { type: String, default: null }, // Optional
    currency: { type: String, required: true },
    coupon: {
      type: new Schema(
        {
          code: { type: String },
          type: { type: String, enum: ['percentage', 'flat'] },
          value: { type: Number },
        },
        { _id: false }
      ),
      default: null, // Set the entire coupon object to null if not provided
    },
    discount_amount: { type: Number, default: 0 },
    isProcessed: { type: Boolean, default: false },
    isZohoInvoiceCreated: { type: Boolean, default: false },
    invoiceNumber: { type: String },
    invoiceDate: { type: Date },
    billingDetails: { type: billingDetailsSchema }, // TODO: required for BULK UNLOCK
  },
  {
    timestamps: true,
  }
);

export const OrderModel = model<TOrder>('Order', orderSchema);
