import config from '../config';
import { DistributedLockService } from '../modules/distributedLock/distributedLock.service';
import { authenticateOdoo } from '../modules/leadGeneration/utils/odoo/odooAuth';
import { createOrUpdateOdooContact } from '../modules/leadGeneration/utils/odoo/odooContactManager';
import { OrderModel } from '../modules/order/order.model';
import { IUser } from '../modules/user/user.interface';

// Local cache to track synced contacts in current session
const contactCache = new Set<string>();

/**
 * Helper function to extract user info from order
 */
function extractUserInfo(
  order: { billingDetails?: { address?: string; city?: string; country?: string; state?: string } },
  user: IUser
) {
  const email = user.emails[0] || '';
  const phone = user.meta_data?.mobileNumber || user.phoneNumbers[0] || '';
  const firstName = user.meta_data?.firstName || '';
  const lastName = user.meta_data?.lastName || '';
  const street = order.billingDetails?.address || '';
  const city = order.billingDetails?.city || '';
  const country = order.billingDetails?.country || '';
  const state = order.billingDetails?.state || '';

  return { email, phone, firstName, lastName, street, city, country, state };
}

/**
 * Helper function to validate user data
 */
function validateUserData(order: { _id?: { toString(): string } }, user: IUser): boolean {
  if (!user) {
    console.warn(`[OdooContactSync] Order ${order._id?.toString()} has no userId populated.`);
    return false;
  }

  const email = user.emails[0] || '';
  const phone = user.meta_data?.mobileNumber || user.phoneNumbers[0] || '';

  if (!email || !phone) {
    console.warn(
      `[OdooContactSync] Skipping order ${order._id?.toString()} due to missing email or phone.`
    );
    return false;
  }

  return true;
}

/**
 * Helper function to generate cache key for contact
 */
function generateContactCacheKey(email: string, phone: string): string {
  return `${email.toLowerCase()}_${phone}`;
}

/**
 * Helper function to check if contact is already synced
 */
function isContactAlreadySynced(email: string, phone: string): boolean {
  const cacheKey = generateContactCacheKey(email, phone);
  return contactCache.has(cacheKey);
}

/**
 * Helper function to mark contact as synced
 */
function markContactAsSynced(email: string, phone: string): void {
  const cacheKey = generateContactCacheKey(email, phone);
  contactCache.add(cacheKey);
}

/**
 * Helper function to sync single contact with caching
 */
async function syncContactWithCache(
  order: { billingDetails?: { address?: string; city?: string; country?: string; state?: string } },
  user: IUser
) {
  const { email, phone, firstName, lastName, street, city, country, state } = extractUserInfo(
    order,
    user
  );

  // Check if contact is already synced in this session
  if (isContactAlreadySynced(email, phone)) {
    return { skipped: true, email };
  }

  await createOrUpdateOdooContact(await authenticateOdoo(), {
    firstName,
    lastName,
    email,
    phone,
    address: { street, city, state, country },
  });

  // Mark as synced after successful sync
  markContactAsSynced(email, phone);
  return { skipped: false, email };
}

/**
 * Helper function to process orders in batches
 */
async function processBatch(
  orders: Array<{
    _id?: { toString(): string };
    userId: unknown;
    billingDetails?: { address?: string; city?: string; country?: string; state?: string };
  }>,
  batchSize: number = 10
) {
  const results = {
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [] as Array<{ orderId: string; error: string }>,
  };

  // Process orders in batches
  for (let i = 0; i < orders.length; i += batchSize) {
    const batch = orders.slice(i, i + batchSize);

    // Process batch in parallel with Promise.allSettled
    const batchResults = await Promise.allSettled(
      batch.map(async order => {
        const user = order.userId as unknown as IUser;

        if (!validateUserData(order, user)) {
          return { status: 'failed', orderId: order._id?.toString(), error: 'Invalid user data' };
        }

        try {
          const result = await syncContactWithCache(order, user);
          return {
            status: result.skipped ? 'skipped' : 'success',
            orderId: order._id?.toString(),
            email: result.email,
          };
        } catch (err) {
          return {
            status: 'failed',
            orderId: order._id?.toString(),
            error: err instanceof Error ? err.message : 'Unknown error',
          };
        }
      })
    );

    // Process batch results
    batchResults.forEach(result => {
      if (result.status === 'fulfilled') {
        const { status, orderId, error } = result.value;
        if (status === 'success') {
          results.success++;
        } else if (status === 'skipped') {
          results.skipped++;
        } else {
          results.failed++;
          results.errors.push({ orderId: orderId || 'unknown', error: error || 'Unknown error' });
        }
      } else {
        results.failed++;
        results.errors.push({
          orderId: 'unknown',
          error: result.reason?.message || 'Promise rejected',
        });
      }
    });

    // Log batch progress
    const processed = Math.min(i + batchSize, orders.length);
    const progress = ((processed / orders.length) * 100).toFixed(1);
    console.log(`[OdooContactSync] Processed ${processed}/${orders.length} orders (${progress}%)`);
  }

  return results;
}

/**
 * Sync function for all orders to Odoo contacts.
 * Features:
 * - Local caching to prevent duplicate updates
 * - Batch processing for better performance
 * - Parallel processing within batches
 * - Comprehensive error handling and reporting
 * - Progress tracking
 * - Memory efficient data processing
 */
export async function syncAllOrdersToOdooContacts() {
  const lockService = DistributedLockService.getInstance();
  const lockKey = 'odoo-contact-sync-all-orders';

  try {
    // Acquire a distributed lock to prevent duplicate processing
    const hasLock = await lockService.acquireLock(lockKey, 1800); // 30 minutes
    if (!hasLock) {
      console.log('[OdooContactSync] Another instance is already syncing contacts. Skipping...');
      return;
    }

    console.log('[OdooContactSync] Starting optimized contact sync...');

    // Clear cache at the start of each sync session
    contactCache.clear();
    console.log('[OdooContactSync] Contact cache cleared for new sync session.');

    // Fetch all orders with query
    console.log('[OdooContactSync] Fetching orders from database...');
    const startTime = Date.now();

    const orders = await OrderModel.find(
      { status: 'PAID' },
      {
        userId: 1,
        billingDetails: 1,
        orderId: 1, // Include for better logging
      }
    )
      .populate('userId', 'meta_data emails phoneNumbers')
      .lean()
      .exec();

    const fetchTime = Date.now() - startTime;
    console.log(`[OdooContactSync] Fetched ${orders.length} orders in ${fetchTime}ms`);

    if (!orders.length) {
      console.log('[OdooContactSync] No orders found.');
      return;
    }

    // Pre-filter valid orders to reduce processing overhead
    const validOrders = orders.filter(order => {
      const user = order.userId as unknown as IUser;
      return user && user.emails?.[0] && (user.meta_data?.mobileNumber || user.phoneNumbers?.[0]);
    });

    console.log(
      `[OdooContactSync] Found ${validOrders.length} valid orders out of ${orders.length} total orders`
    );

    if (!validOrders.length) {
      console.log('[OdooContactSync] No valid orders found for contact sync.');
      return;
    }

    // Process orders in batches
    const batchSize = 15; // Optimal batch size for parallel processing
    console.log(`[OdooContactSync] Processing orders in batches of ${batchSize}...`);

    const syncStartTime = Date.now();
    const results = await processBatch(validOrders, batchSize);
    const syncTime = Date.now() - syncStartTime;

    // Log results
    console.log('\n[OdooContactSync] ===== SYNC RESULTS =====');
    console.log(`[OdooContactSync] Total orders processed: ${validOrders.length}`);
    console.log(`[OdooContactSync] Successfully synced: ${results.success}`);
    console.log(`[OdooContactSync] Skipped (already synced): ${results.skipped}`);
    console.log(`[OdooContactSync] Failed: ${results.failed}`);
    console.log(`[OdooContactSync] Total time: ${syncTime}ms`);
    console.log(
      `[OdooContactSync] Average time per order: ${(syncTime / validOrders.length).toFixed(2)}ms`
    );
    console.log(`[OdooContactSync] Cache hits: ${results.skipped}`);
    console.log(
      `[OdooContactSync] Cache efficiency: ${((results.skipped / validOrders.length) * 100).toFixed(1)}%`
    );

    // Log errors if any
    if (results.errors.length > 0) {
      console.log('\n[OdooContactSync] ===== ERRORS =====');
      results.errors.slice(0, 10).forEach(({ orderId, error }) => {
        console.error(`[OdooContactSync] Order ${orderId}: \n`, error);
      });
      if (results.errors.length > 10) {
        console.error(`[OdooContactSync] ... and ${results.errors.length - 10} more errors`);
      }
    }

    console.log('[OdooContactSync] ===== SYNC COMPLETE =====\n');
  } catch (err) {
    console.error('[OdooContactSync] Critical error in contact sync: \n', err);
    throw err; // Re-throw to ensure proper error handling
  }
}

let contactSyncStarted = false;

/**
 * Schedules the contact sync job.
 * Runs once immediately when called (one-time sync, not scheduled).
 */
export const scheduleAllOrdersToOdooContactSync = () => {
  if (contactSyncStarted) {
    console.log('[OdooContactSync] Contact sync job already started. Skipping.');
    return;
  }
  contactSyncStarted = true;

  if (config.FSEnvironment === 'production') {
    console.log('[OdooContactSync] Starting optimized contact sync job...');
    syncAllOrdersToOdooContacts().catch(err => {
      console.error('[OdooContactSync] Contact sync job failed: \n', err);
    });
  } else {
    console.log('[OdooContactSync] Contact sync job not started. FSEnvironment is not production.');
  }
};
