import { Types } from 'mongoose';
import cron from 'node-cron';
import config from '../config';
import { DistributedLockService } from '../modules/distributedLock/distributedLock.service';
import { MailchimpUserData } from '../modules/mailchimp/mailchimp.interface';
import { MailchimpServices } from '../modules/mailchimp/mailchimp.service';
import { TOrder } from '../modules/order/order.interface';
import { OrderModel } from '../modules/order/order.model';
import { IUser } from '../modules/user/user.interface';

// Subscription service IDs to check for
const SUBSCRIPTION_SERVICE_IDS = ['66cf5d594541a8f007d984f1', '66d04172f9a519da7ffe4ad3'];

// Local cache to track synced users in current session
const userCache = new Set<string>();

/**
 * Helper function to extract user info from order
 */
function extractUserInfo(order: TOrder & { _id: Types.ObjectId }, user: IUser) {
  const firstName = user.meta_data?.firstName || '';
  const lastName = user.meta_data?.lastName || '';
  const email = user.emails[0] || '';

  return { firstName, lastName, email };
}

/**
 * Helper function to validate user data
 */
function validateUserData(order: TOrder & { _id: Types.ObjectId }, user: IUser) {
  if (!user) {
    console.warn(`[MailchimpSync] Order ${order._id.toString()} has no userId populated.`);
    return false;
  }

  const email = user.emails[0] || '';

  if (!email) {
    console.warn(`[MailchimpSync] Skipping order ${order._id.toString()} due to missing email.`);
    return false;
  }

  return true;
}

/**
 * Helper function to generate cache key for user
 */
function generateUserCacheKey(email: string): string {
  return email.toLowerCase();
}

/**
 * Helper function to check if user is already synced
 */
function isUserAlreadySynced(email: string): boolean {
  const cacheKey = generateUserCacheKey(email);
  return userCache.has(cacheKey);
}

/**
 * Helper function to mark user as synced
 */
function markUserAsSynced(email: string): void {
  const cacheKey = generateUserCacheKey(email);
  userCache.add(cacheKey);
}

/**
 * Helper function to determine tags based on plan
 */
function getTagsForPlan(plan?: string): string[] {
  if (plan === 'trial') {
    return ['nca_trial_new_subscriber'];
  } else if (plan === 'monthly' || plan === 'quarterly' || plan === 'annually') {
    return ['nca_fullplan_subscriber'];
  }
  return [];
}

/**
 * Helper function to sync order to Mailchimp audience
 */
async function syncOrderToMailchimp(order: TOrder & { _id: Types.ObjectId }, user: IUser) {
  const { firstName, lastName, email } = extractUserInfo(order, user);

  // Check if user is already synced in this session
  if (isUserAlreadySynced(email)) {
    console.log(`[MailchimpSync] User ${email} already synced in this session, skipping.`);
    return { skipped: true };
  }

  // Find subscription items for the specified service IDs
  const subscriptionItems = order.items.filter(
    item =>
      SUBSCRIPTION_SERVICE_IDS.includes(item.serviceId.toString()) &&
      item.serviceType === 'subscription'
  );

  if (!subscriptionItems.length) {
    console.log(`[MailchimpSync] No subscription items found for order ${order._id.toString()}`);
    return { skipped: true };
  }

  // Get tags from the first subscription item (assuming one subscription per order)
  const subscriptionItem = subscriptionItems[0];
  const tags = getTagsForPlan(subscriptionItem.customAttributes?.plan);

  if (!tags.length) {
    console.log(`[MailchimpSync] No valid plan found for order ${order._id.toString()}`);
    return { skipped: true };
  }

  const userData: MailchimpUserData = {
    email,
    firstName,
    lastName,
    tags,
  };

  await MailchimpServices.addOrUpdateUserToAudience(userData);

  // Mark as synced after successful sync
  markUserAsSynced(email);
  return { skipped: false, tags };
}

/**
 * Syncs paid subscription orders to Mailchimp audience with appropriate tags.
 * - Fetches PAID orders in the time window that have subscription items
 * - Syncs user details to Mailchimp audience
 * - Applies 'trial' tag for trial plans, 'full-plan' tag for other plans
 * - Uses caching to avoid duplicate processing in the same session
 * @param {Date} start - Start of the time window
 * @param {Date} end - End of the time window
 */
export async function syncPaidSubscriptionOrdersToMailchimp(start: Date, end: Date) {
  const lockService = DistributedLockService.getInstance();
  const lockKey = 'mailchimp-audience-sync-60min';

  try {
    // Acquire a distributed lock to prevent duplicate processing
    const hasLock = await lockService.acquireLock(lockKey, 240); // 4 minutes
    if (!hasLock) {
      console.log(
        '[MailchimpSync] Another instance is already syncing to Mailchimp audience. Skipping...'
      );
      return;
    }

    // Clear cache at the start of each sync session
    userCache.clear();
    console.log('[MailchimpSync] User cache cleared for new sync session.');

    // 1. Fetch PAID orders in the given time window that have subscription items
    const orders = (await OrderModel.find(
      {
        status: 'PAID',
        createdAt: { $gte: start, $lte: end },
        'items.serviceId': { $in: SUBSCRIPTION_SERVICE_IDS },
        'items.serviceType': 'subscription',
      },
      { userId: 1, orderId: 1, items: 1 }
    )
      .populate('userId', 'meta_data emails')
      .lean()) as Array<TOrder & { _id: Types.ObjectId }>;

    if (!orders.length) {
      console.log('[MailchimpSync] No subscription orders found in the time window.');
      return;
    }

    console.log(`[MailchimpSync] Found ${orders.length} subscription orders in time window.`);

    // 2. Sync orders to Mailchimp audience
    console.log('[MailchimpSync] Starting Mailchimp audience sync...');
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;
    let trialCount = 0;
    let fullPlanCount = 0;

    for (const order of orders) {
      const user = order.userId as unknown as IUser;

      if (!validateUserData(order, user)) {
        failCount++;
        continue;
      }

      try {
        const result = await syncOrderToMailchimp(order, user);
        if (result.skipped) {
          skippedCount++;
        } else {
          successCount++;
          // Count tag types for reporting
          if (result.tags?.includes('trial')) {
            trialCount++;
          } else if (result.tags?.includes('full-plan')) {
            fullPlanCount++;
          }
        }
      } catch (err) {
        console.error(
          `[MailchimpSync] Failed to sync order ${order._id.toString()} to Mailchimp: \n`,
          err
        );
        failCount++;
      }
    }

    console.log(
      `[MailchimpSync] Mailchimp audience sync complete. Success: ${successCount}, Skipped: ${skippedCount}, Failed: ${failCount}`
    );
    console.log(
      `[MailchimpSync] Tag breakdown - Trial: ${trialCount}, Full Plan: ${fullPlanCount}`
    );
  } catch (err) {
    console.error('[MailchimpSync] Error in Mailchimp audience sync: \n', err);
  }
}

/**
 * Schedules the cron job for syncing paid subscription orders to Mailchimp audience.
 * Runs every hour (adjust as needed for production).
 */
export const schedulePaidSubscriptionOrdersToMailchimp = () => {
  if (config.FSEnvironment === 'production') {
    console.log(
      '[MailchimpSync] Paid subscription orders Mailchimp audience sync cron job is starting in production environment.'
    );

    cron.schedule(
      '*/60 * * * *', // every hour
      async () => {
        const now = new Date();
        const start = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
        await syncPaidSubscriptionOrdersToMailchimp(start, now);
      },
      {
        scheduled: true,
        timezone: 'Asia/Kolkata',
      }
    );
    console.log(
      '[MailchimpSync] Paid subscription orders Mailchimp audience sync cron job scheduled for every 1 hour.'
    );
  } else {
    console.log(
      '[MailchimpSync] Paid subscription orders Mailchimp audience sync cron job not started. FSEnvironment is not set to production.'
    );
  }

  // for testing
  //   const now = new Date();
  //   const start = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
  //   syncPaidSubscriptionOrdersToMailchimp(start, now);
};
