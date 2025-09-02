import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { FeedbackControllers } from './feedback.controller';
import { feedbackValidationSchema } from './feedback.validation';

const router = express.Router();

router.post(
  '/create',
  validateRequest(feedbackValidationSchema),
  FeedbackControllers.createFeedback
);

export const FeedbackRoutes = router;
