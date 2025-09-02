import { Types } from 'mongoose';
import cron from 'node-cron';
import config from '../config';
import { DistributedLockService } from '../modules/distributedLock/distributedLock.service';
import { authenticateOdoo } from '../modules/leadGeneration/utils/odoo/odooAuth';
import { createOrUpdateOdooContact } from '../modules/leadGeneration/utils/odoo/odooContactManager';
import {
  createOdooOpportunity,
  OdooOpportunityParams,
} from '../modules/leadGeneration/utils/odoo/odooOpportunityManager';
import { TOrder } from '../modules/order/order.interface';
import { OrderModel } from '../modules/order/order.model';
import { calculateSubscriptionZonalPrice } from '../modules/order/utils/calculateSubscriptionZonalPrice';
import { TServiceCatalog } from '../modules/serviceCatalog/serviceCatalog.interface';
import { ServiceCatalogModel } from '../modules/serviceCatalog/serviceCatalog.model';
import { IUser } from '../modules/user/user.interface';

// Local cache to track synced contacts in current session
const contactCache = new Set<string>();

/**
 * Helper function to extract user and billing info from order
 */
function extractUserInfo(order: TOrder & { _id: Types.ObjectId }, user: IUser) {
  const userName =
    `${user.meta_data?.firstName || ''} ${user.meta_data?.lastName || ''}`.trim() || user.emails[0];
  const email = user.emails[0] || '';
  const phone = user.meta_data?.mobileNumber || user.phoneNumbers[0] || '';
  const street = order.billingDetails?.address || '';
  const city = order.billingDetails?.city || '';
  const country = order.billingDetails?.country || '';
  const state = order.billingDetails?.state || '';

  return { userName, email, phone, street, city, country, state };
}

/**
 * Helper function to validate user data
 */
function validateUserData(order: TOrder & { _id: Types.ObjectId }, user: IUser) {
  if (!user) {
    console.warn(`[OdooSync] Order ${order._id.toString()} has no userId populated.`);
    return false;
  }

  const email = user.emails[0] || '';
  const phone = user.meta_data?.mobileNumber || user.phoneNumbers[0] || '';

  if (!email || !phone) {
    console.warn(
      `[OdooSync] Skipping order ${order._id.toString()} due to missing email or phone.`
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
 * Helper function to sync order to Odoo contact with caching
 */
async function syncOrderToContact(order: TOrder & { _id: Types.ObjectId }, user: IUser) {
  const { email, phone, street, city, country, state } = extractUserInfo(order, user);

  // Check if contact is already synced in this session
  if (isContactAlreadySynced(email, phone)) {
    console.log(`[OdooSync] Contact ${email} already synced in this session, skipping.`);
    return { skipped: true };
  }

  const firstName = user.meta_data?.firstName || '';
  const lastName = user.meta_data?.lastName || '';

  await createOrUpdateOdooContact(await authenticateOdoo(), {
    firstName,
    lastName,
    email,
    phone,
    address: { street, city, state, country },
  });

  // Mark as synced after successful sync
  markContactAsSynced(email, phone);
  return { skipped: false };
}

/**
 * Helper function to create opportunity payload
 */
function createOpportunityPayload(
  order: TOrder & { _id: Types.ObjectId },
  user: IUser,
  item: { customAttributes?: { plan?: string; zone?: string[] } },
  service: TServiceCatalog
): (OdooOpportunityParams & { orderId: string }) | null {
  const { userName, email, phone, street, city, country, state } = extractUserInfo(order, user);

  const plan = item.customAttributes?.plan;
  const zone = item.customAttributes?.zone || ['All'];

  let expected_revenue = 0;
  let description = '';
  let name = '';

  if (plan === 'trial') {
    expected_revenue = calculateSubscriptionZonalPrice(service.zonalPricing || [], 'monthly', zone);
    description = `Subscribed to Trial Plan. Order ID: ${order.orderId}`;
    name = `${userName} - Trial | ${service.name || 'New Company Alert'} | ${order.orderId}`;
  } else if (plan === 'monthly') {
    expected_revenue = calculateSubscriptionZonalPrice(
      service.zonalPricing || [],
      'quarterly',
      zone
    );
    description = `Subscribed to Monthly Plan. Order ID: ${order.orderId}`;
    name = `${userName} - Monthly | ${service.name || 'New Company Alert'} | ${order.orderId}`;
  } else if (plan === 'quarterly') {
    expected_revenue = calculateSubscriptionZonalPrice(
      service.zonalPricing || [],
      'annually',
      zone
    );
    description = `Subscribed to Quarterly Plan. Order ID: ${order.orderId}`;
    name = `${userName} - Quarterly | ${service.name || 'New Company Alert'} | ${order.orderId}`;
  } else {
    return null; // Skip annual plan or unknown
  }

  return {
    name,
    userName,
    email_from: email,
    phone,
    street,
    city,
    country,
    state,
    description,
    expected_revenue,
    orderId: order.orderId,
  };
}

/**
 * Cron job and sync logic for pushing subscription orders to Odoo CRM as opportunities.
 * - Runs on a schedule (see scheduleTrialSubscriptionToOdooOpportunity)
 * - Uses a distributed lock to avoid duplicate processing
 * - For each paid order with a subscription, creates an Odoo opportunity
 * - Also syncs all orders to Odoo contacts to avoid re-fetching
 */

/**
 * Syncs all orders to Odoo contacts and subscription orders to opportunities.
 * - Fetches ALL orders in the time window (not just subscriptions)
 * - Syncs all client details to Odoo contacts first (with caching)
 * - Then filters subscription orders for opportunities
 * - Avoids unnecessary re-fetches and re-renders
 * @param {Date} start - Start of the time window
 * @param {Date} end - End of the time window
 */
export async function syncPaidOrdersToOdoo(start: Date, end: Date) {
  const lockService = DistributedLockService.getInstance();
  const lockKey = 'odoo-opportunity-trigger-60min';

  try {
    // Acquire a distributed lock to prevent duplicate processing
    const hasLock = await lockService.acquireLock(lockKey, 240); // 4 minutes
    if (!hasLock) {
      console.log(
        '[OdooSync] Another instance is already checking Odoo opportunities. Skipping...'
      );
      return;
    }

    // Clear cache at the start of each sync session
    contactCache.clear();
    console.log('[OdooSync] Contact cache cleared for new sync session.');

    // 1. Fetch ALL PAID orders in the given time window
    const orders = (await OrderModel.find(
      { status: 'PAID', createdAt: { $gte: start, $lte: end } },
      { userId: 1, orderId: 1, items: 1, billingDetails: 1 }
    )
      .populate('userId', 'meta_data emails phoneNumbers')
      .lean()) as Array<TOrder & { _id: Types.ObjectId }>;

    if (!orders.length) {
      console.log('[OdooSync] No orders found in the time window.');
      return;
    }

    console.log(`[OdooSync] Found ${orders.length} total orders in time window.`);

    // 2. Sync ALL orders to Odoo contacts with caching
    console.log('[OdooSync] Starting contact sync for all orders...');
    let contactSuccessCount = 0;
    let contactFailCount = 0;
    let contactSkippedCount = 0;

    for (const order of orders) {
      const user = order.userId as unknown as IUser;

      if (!validateUserData(order, user)) {
        contactFailCount++;
        continue;
      }

      try {
        const result = await syncOrderToContact(order, user);
        if (result.skipped) {
          contactSkippedCount++;
        } else {
          contactSuccessCount++;
        }
      } catch (err) {
        console.error(
          `[OdooSync] Failed to sync contact for order ${order._id.toString()}: \n`,
          err
        );
        contactFailCount++;
      }
    }

    console.log(
      `[OdooSync] Contact sync complete. Success: ${contactSuccessCount}, Skipped: ${contactSkippedCount}, Failed: ${contactFailCount}`
    );

    // 3. Filter subscription orders for opportunities
    const subscriptionOrders = orders.filter(order =>
      order.items.some(item => item.serviceType === 'subscription')
    );

    if (!subscriptionOrders.length) {
      console.log('[OdooSync] No subscription orders found for opportunities.');
      return;
    }

    console.log(
      `[OdooSync] Found ${subscriptionOrders.length} subscription orders for opportunities.`
    );

    // 4. Extract service IDs and fetch service catalog
    const serviceIds = [
      ...new Set(
        subscriptionOrders
          .flatMap(order => order.items)
          .filter(item => item.serviceType === 'subscription' && item.serviceId)
          .map(item => item.serviceId.toString())
      ),
    ];

    if (!serviceIds.length) {
      console.log('[OdooSync] No valid subscription items found.');
      return;
    }

    const services = await ServiceCatalogModel.find(
      { _id: { $in: serviceIds } },
      { zonalPricing: 1, name: 1 }
    ).lean();

    const serviceMap: Record<string, TServiceCatalog> = {};
    for (const service of services as (TServiceCatalog & { _id: Types.ObjectId })[]) {
      serviceMap[service._id.toString()] = service;
    }

    // 5. Create opportunity payloads
    const odooOpportunities: (OdooOpportunityParams & { orderId: string })[] = [];

    for (const order of subscriptionOrders) {
      const user = order.userId as unknown as IUser;

      if (!validateUserData(order, user)) continue;

      const subscriptionItem = order.items.find(item => item.serviceType === 'subscription');
      if (!subscriptionItem?.serviceId) {
        console.warn(`[OdooSync] Order ${order._id.toString()} has no valid subscription item.`);
        continue;
      }

      const service = serviceMap[subscriptionItem.serviceId.toString()];
      if (!service?.zonalPricing) {
        console.warn(
          `[OdooSync] No zonalPricing found for serviceId ${subscriptionItem.serviceId} in order ${order._id.toString()}`
        );
        continue;
      }

      const opportunity = createOpportunityPayload(order, user, subscriptionItem, service);
      if (opportunity) {
        odooOpportunities.push(opportunity);
      }
    }

    if (!odooOpportunities.length) {
      console.log('[OdooSync] No valid Odoo opportunities to sync.');
      return;
    }

    console.log(`[OdooSync] Found ${odooOpportunities.length} valid Odoo opportunities to sync.`);

    // 6. Send opportunities to Odoo
    const results = await Promise.allSettled(
      odooOpportunities.map(async opp => {
        try {
          await createOdooOpportunity(opp);
          console.log(
            `[OdooSync] Odoo opportunity created for order ${opp.orderId} (user: ${opp.email_from})`
          );
        } catch (err) {
          console.error(`[OdooSync] Failed to sync order ${opp.orderId} to Odoo: \n`, err);
        }
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.length - successCount;
    console.log(
      `[OdooSync] Odoo opportunity sync complete. Success: ${successCount}, Failed: ${failCount}`
    );
  } catch (err) {
    console.error('[OdooSync] Error in subscription Odoo opportunity sync: \n', err);
  }
}

/**
 * Schedules the cron job for syncing paid orders to Odoo CRM.
 * Runs every hour (adjust as needed for production).
 */
export const schedulePaidOrdersToOdooOpportunity = () => {
  if (config.FSEnvironment === 'production') {
    console.log(
      '[OdooSync] Paid orders Odoo opportunity cron job is starting in production environment.'
    );

    cron.schedule(
      '*/60 * * * *', // every hour
      async () => {
        const now = new Date();
        const start = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
        await syncPaidOrdersToOdoo(start, now);
      },
      {
        scheduled: true,
        timezone: 'Asia/Kolkata',
      }
    );
    console.log(
      '[OdooSync] Paid orders (for now only subscription orders) Odoo opportunity cron job scheduled for every 1 hour.'
    );
  } else {
    console.log(
      '[OdooSync] Paid orders (for now only subscription orders) Odoo opportunity cron job not started. FSEnvironment is not set to production.'
    );
  }

  // for testing
  //   const now = new Date();
  //   const start = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
  //   syncSubscriptionsToOdoo(start, now);
};
