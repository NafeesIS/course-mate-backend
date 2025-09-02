import cron from 'node-cron';
import { SubscriptionModel } from '../modules/subscription/subscription.model';
import config from '../config';

// Cron job to update subscription statuses
const scheduleSubscriptionStatusUpdate = () => {
  if (config.FSEnvironment === 'production') {
    console.log('Subscription status updater cron job is starting in production environment.');

    cron.schedule('0 20 * * *', async () => {
      console.log(
        '=======>> Running daily subscription status update job at 2:00 AM Dhaka Time (8:00 PM UTC)...'
      );

      try {
        const now = new Date();

        // Log the current time for debugging
        console.log(`Current UTC Time: ${now.toISOString()}`);

        // Update subscriptions that are expired but still marked as active
        const result = await SubscriptionModel.updateMany(
          { endDate: { $lt: now }, status: 'active' },
          { $set: { status: 'expired' } }
        );

        console.log(`Updated ${result.modifiedCount} subscriptions to expired.`);
      } catch (error) {
        console.error('Error running subscription status update:', error);
      }
    });

    console.log('Subscription status updater cron job scheduled.');
  } else {
    console.log(
      'Subscription status updater cron job not started. FSEnvironment is not set to production.'
    );
  }
};

export default scheduleSubscriptionStatusUpdate;
