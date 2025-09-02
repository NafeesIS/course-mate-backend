import express from 'express';
// import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import validateRequest from '../../middlewares/validateRequest';
import { CouponControllers } from './coupon.controller';
import { createCouponValidationSchema, updateCouponValidationSchema } from './coupon.validation';

const router = express.Router();

// verify coupon: if coupon is valid or not
router.post('/verify', verifySession(), CouponControllers.verifyCoupon);

// ---- ADMIN ONLY ROUTES ----

// create a coupon
router.post(
  '/create',
  verifySession(),
  validateRequest(createCouponValidationSchema),
  CouponControllers.createCoupon
);

// get all coupons
router.get('/list', verifySession(), CouponControllers.getAllCoupons);
// router.get('/list', CouponControllers.getAllCoupons);

// delete a coupon
router.delete('/delete/:code', verifySession(), CouponControllers.deleteCoupon);
// router.delete('/delete/:code', CouponControllers.deleteCoupon);

// update a coupon
router.patch(
  '/update/:code',
  verifySession(),
  validateRequest(updateCouponValidationSchema),
  CouponControllers.updateCoupon
);

// ---- END ADMIN ONLY ROUTES ----

export const CouponRoutes = router;
