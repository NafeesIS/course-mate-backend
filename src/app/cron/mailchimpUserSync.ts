import cron from 'node-cron';
import config from '../config';
import { DistributedLockService } from '../modules/distributedLock/distributedLock.service';
import { MailchimpUserData } from '../modules/mailchimp/mailchimp.interface';
import { MailchimpServices } from '../modules/mailchimp/mailchimp.service';
import { IUser } from '../modules/user/user.interface';
import { UserModel } from '../modules/user/user.model';

/**
 * 🚀 MAILCHIMP USER SYNC CRONJOB
 *
 * Syncs users who joined in the last 24 hours to Mailchimp audience.
 * Runs every 24 hours to keep the audience up-to-date.
 */

// Configuration constants
const CONFIG = {
  BATCH_SIZE: 100,
  BATCH_DELAY_MS: 1000,
  LOCK_KEY: 'mailchimp-user-sync-24h',
  LOCK_TTL_SECONDS: 300, // 5 minutes
  TAG_NAME: '',
  CRON_SCHEDULE: '0 1 * * *', // Every night at 1 AM
  TIMEZONE: 'Asia/Kolkata',
} as const;

// Types
interface SyncResult {
  skipped: boolean;
  tags?: string[];
  error?: string;
}

interface SyncStats {
  processed: number;
  success: number;
  skipped: number;
  failed: number;
  usersWithPhone: number;
}

// Local cache to track synced users in current session
const userCache = new Set<string>();

/**
 * Extract user info from user document
 */
function extractUserInfo(user: IUser): {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
} {
  try {
    const firstName = user.meta_data?.firstName || '';
    const lastName = user.meta_data?.lastName || '';
    const email = user.emails[0] || '';

    // Extract phone number from billing details if available
    let phoneNumber = '';
    if (
      user.billingDetails &&
      Array.isArray(user.billingDetails) &&
      user.billingDetails.length > 0
    ) {
      // Find default billing or first valid billing object
      const defaultBilling =
        user.billingDetails.find(
          billing => billing && typeof billing === 'object' && billing.isDefault === true
        ) || user.billingDetails.find(billing => billing && typeof billing === 'object');

      if (defaultBilling && defaultBilling.mobileNumber) {
        phoneNumber = defaultBilling.mobileNumber;
      }
    }

    return { firstName, lastName, email, phoneNumber };
  } catch (error) {
    console.error(`[MailchimpSync] Error extracting user info for user ${user.uId}:`, error);
    // Return safe fallback values
    return {
      firstName: '',
      lastName: '',
      email: user.emails?.[0] || '',
      phoneNumber: '',
    };
  }
}

/**
 * Validate user data before processing
 */
function validateUserData(user: IUser): boolean {
  if (!user || !user.emails[0]) {
    return false;
  }
  return true;
}

/**
 * Check if user is already synced in this session
 */
function isUserAlreadySynced(email: string): boolean {
  return userCache.has(email.toLowerCase());
}

/**
 * Mark user as synced
 */
function markUserAsSynced(email: string): void {
  userCache.add(email.toLowerCase());
}

/**
 * Sync single user to Mailchimp
 */
async function syncUserToMailchimp(user: IUser): Promise<SyncResult> {
  const { firstName, lastName, email, phoneNumber } = extractUserInfo(user);

  // Skip if already synced
  if (isUserAlreadySynced(email)) {
    return { skipped: true };
  }

  const userData: MailchimpUserData = {
    email,
    firstName,
    lastName,
    phoneNumber,
  };

  if (CONFIG.TAG_NAME) {
    userData.tags = [CONFIG.TAG_NAME];
  }

  try {
    await MailchimpServices.addOrUpdateUserToAudience(userData);
    markUserAsSynced(email);
    return { skipped: false };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { skipped: false, error: errorMessage };
  }
}

/**
 * Process a batch of users
 */
async function processUserBatch(users: IUser[], stats: SyncStats): Promise<void> {
  for (const user of users) {
    try {
      stats.processed++;

      // Debug: Log user structure for first few users to identify issues
      if (stats.processed <= 3) {
        console.log(`[MailchimpSync] Debug - User ${stats.processed}:`, {
          uId: user.uId,
          hasMetaData: !!user.meta_data,
          hasEmails: !!user.emails,
          emailsLength: user.emails?.length,
          hasBillingDetails: !!user.billingDetails,
          billingDetailsType: typeof user.billingDetails,
          billingDetailsLength: Array.isArray(user.billingDetails)
            ? user.billingDetails.length
            : 'not array',
        });
      }

      if (!validateUserData(user)) {
        console.log(`[MailchimpSync] User validation failed for user ${user.uId}`);
        stats.failed++;
        continue;
      }

      const result = await syncUserToMailchimp(user);

      if (result.skipped) {
        stats.skipped++;
      } else if (result.error) {
        console.error(`[MailchimpSync] Failed to sync user ${user.uId}: ${result.error}`);
        stats.failed++;
      } else {
        stats.success++;

        // Count users with phone numbers
        const { phoneNumber } = extractUserInfo(user);
        if (phoneNumber) {
          stats.usersWithPhone++;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[MailchimpSync] Unexpected error syncing user ${user.uId}: ${errorMessage}`);
      console.error('[MailchimpSync] User object structure:', {
        uId: user.uId,
        meta_data: user.meta_data,
        emails: user.emails,
        billingDetails: user.billingDetails,
      });
      stats.failed++;
    }
  }
}

/**
 * Log sync statistics
 */
function logSyncStats(stats: SyncStats): void {
  console.log(
    `[MailchimpSync] Sync complete. Processed: ${stats.processed}, Success: ${stats.success}, Skipped: ${stats.skipped}, Failed: ${stats.failed}`
  );
  console.log(`[MailchimpSync] Users with phone numbers: ${stats.usersWithPhone}`);
}

/**
 * Main function to sync users from last 24 hours to Mailchimp
 */
export async function syncRecentUsersToMailchimp(
  batchSize: number = CONFIG.BATCH_SIZE,
  batchDelay: number = CONFIG.BATCH_DELAY_MS
): Promise<void> {
  const lockService = DistributedLockService.getInstance();
  const startTime = Date.now();

  try {
    // Acquire distributed lock to prevent duplicate processing
    const hasLock = await lockService.acquireLock(CONFIG.LOCK_KEY, CONFIG.LOCK_TTL_SECONDS);
    if (!hasLock) {
      console.log('[MailchimpSync] Another instance is already running. Skipping...');
      return;
    }

    console.log('[MailchimpSync] Starting user sync process...');

    // Clear cache and calculate time threshold
    userCache.clear();
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    console.log('[MailchimpSync] Looking for users who joined in the last 24 hours');

    // Get total count of recent users
    const totalUsers = await UserModel.countDocuments({
      timeJoined: { $gte: twentyFourHoursAgo },
    });

    if (totalUsers === 0) {
      console.log('[MailchimpSync] No users found in the last 24 hours.');
      return;
    }

    console.log(`[MailchimpSync] Found ${totalUsers} users to sync`);

    // Initialize statistics
    const stats: SyncStats = {
      processed: 0,
      success: 0,
      skipped: 0,
      failed: 0,
      usersWithPhone: 0,
    };

    // Process users in batches
    const totalBatches = Math.ceil(totalUsers / batchSize);

    for (let skip = 0; skip < totalUsers; skip += batchSize) {
      const batchNumber = Math.floor(skip / batchSize) + 1;

      console.log(`[MailchimpSync] Processing batch ${batchNumber}/${totalBatches}`);

      try {
        const users = (await UserModel.find(
          { timeJoined: { $gte: twentyFourHoursAgo } },
          {
            uId: 1,
            meta_data: 1,
            emails: 1,
            billingDetails: 1,
          }
        )
          .skip(skip)
          .limit(batchSize)
          .lean()) as IUser[];

        await processUserBatch(users, stats);

        // Add delay between batches
        if (skip + batchSize < totalUsers) {
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[MailchimpSync] Error processing batch ${batchNumber}: ${errorMessage}`);
        stats.failed += batchSize;
      }
    }

    // Log final statistics
    logSyncStats(stats);

    const totalTime = Date.now() - startTime;
    console.log(`[MailchimpSync] Total sync time: ${totalTime}ms`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[MailchimpSync] Critical error: ${errorMessage}`);
    throw error;
  }
}

/**
 * Schedule the cron job to run every 24 hours
 */
export const scheduleMailchimpUserSync = (): void => {
  if (config.FSEnvironment === 'production') {
    console.log('[MailchimpSync] Starting Mailchimp user sync cron job (every 24 hours)');

    cron.schedule(
      CONFIG.CRON_SCHEDULE,
      async () => {
        try {
          await syncRecentUsersToMailchimp();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[MailchimpSync] Cron job failed: ${errorMessage}`);
        }
      },
      {
        scheduled: true,
        timezone: CONFIG.TIMEZONE,
      }
    );

    console.log('[MailchimpSync] Cron job scheduled for every 24 hours');
  } else {
    console.log('[MailchimpSync] Cron job not started (not in production)');
  }

  // For testing - uncomment to test with small batch
  // syncRecentUsersToMailchimp(5, 100);
};
