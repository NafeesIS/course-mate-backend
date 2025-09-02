import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import validateRequest from '../../middlewares/validateRequest';
import { verifyAdmin } from '../../middlewares/verifyAdmin';
import { OrderControllers } from './order.controller';
import { createOrderValidationSchema } from './order.validation';

const router = express.Router();

router.get('/', verifySession(), verifyAdmin, OrderControllers.getOrdersWithPagination);

router.post(
  '/create-order',
  verifySession(),
  validateRequest(createOrderValidationSchema),
  OrderControllers.createOrder
);

router.get('/verify-payment', verifySession(), OrderControllers.verifyPayment);

// Only for admin to manually update payment
router.get(
  '/verify-payment-admin-only',
  // verifySession(),
  // verifyAdmin,
  OrderControllers.verifyPaymentAdminOnly
);

router.get('/order-details/:orderId', verifySession(), OrderControllers.getOrderDetails);

export const OrderRoutes = router;
