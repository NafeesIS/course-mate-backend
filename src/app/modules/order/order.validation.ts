import { z } from 'zod';

const orderItemValidationSchema = z.object({
  serviceId: z.string().refine(val => val.match(/^[0-9a-fA-F]{24}$/), {
    message: 'Invalid ObjectId for serviceId',
  }),
  serviceName: z.string().min(1, 'Service name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  plan: z.enum(['monthly', 'quarterly', 'annually']).optional(),
  price: z.number().min(0, 'Price must be at least 0'),
});

const couponValidationSchema = z
  .object({
    code: z.string(),
    type: z.enum(['percentage', 'flat']),
    value: z.number(),
  })
  .nullable(); // Allow the entire coupon object to be null

const createOrderValidationSchema = z.object({
  body: z.object({
    userId: z.string().refine(val => val.match(/^[0-9a-fA-F]{24}$/), {
      message: 'Invalid ObjectId for userId',
    }),
    items: z.array(orderItemValidationSchema).nonempty('At least one item is required'),
    value: z.number().min(0, 'Total amount must be at least 0'),
    gst: z.number().min(0, 'GST must be at least 0'),
    currency: z.string().min(1, 'Currency is required'),
    coupon: couponValidationSchema.optional(),
    discount_amount: z.number().min(0, 'Discount amount must be at least 0').default(0), // Default to 0
    paymentId: z.string().optional(),
  }),
});

export { createOrderValidationSchema };
