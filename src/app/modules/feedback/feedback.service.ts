import { sendSlackFeedbackNotification } from '../leadGeneration/utils/sendSlackNotification';
import { UserModel } from '../user/user.model';
import { FeedbackDocument } from './feedback.interface';
import { FeedbackModel } from './feedback.model';

const createFeedbackIntoDB = async (data: FeedbackDocument) => {
  const payload: Partial<typeof data> = {
    overall: data.overall,
    website: data.website,
    recommend: data.recommend,
    support: data.support,
    userType: data.userType,
  };

  if (data.userEmail) {
    const existingUser = await UserModel.findOne({ emails: data.userEmail });
    if (existingUser) {
      payload.userType = 'registered';
    } else {
      payload.userType = 'guest';
    }
  }

  if (data.feedback) {
    payload.feedback = data.feedback
      .replace(/\s+/g, ' ')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '')
      .trim();
  }

  if (data.userEmail) {
    payload.userEmail = data.userEmail;
  }

  const createdFeedback = await FeedbackModel.create(payload);
  await sendSlackFeedbackNotification(payload);
  return createdFeedback;
};

export const FeedbackServices = {
  createFeedbackIntoDB,
};
