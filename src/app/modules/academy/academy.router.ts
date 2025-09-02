import express from 'express';
import { AcademyControllers } from './academy.controller';

const router = express.Router();

router.get('/promo-users', AcademyControllers.getPromoUser);
router.post('/promo-users', AcademyControllers.createPromoUser);

export const AcademyRoutes = router;
