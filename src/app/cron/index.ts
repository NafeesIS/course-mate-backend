import { scheduleDailySalesReport } from './dailySalesReport';
import { scheduleMailchimpUserSync } from './mailchimpUserSync';
import { schedulePaidOrdersToOdooOpportunity } from './odooOpportunitySync';
import scheduleSubscriptionStatusUpdate from './subscriptionStatusUpdate';
import scheduleTransactionStatusChecker from './transactionStatusChecker';
import scheduleZohoInvoiceGeneration from './zohoInvoiceGenerator';

// Initialize all cron jobs
const initializeCronJobs = () => {
  // Initialize subscription status update cron job
  scheduleSubscriptionStatusUpdate();

  // Initialize Zoho invoice generation cron job
  scheduleZohoInvoiceGeneration();

  // Initialize daily sales report cron job
  scheduleDailySalesReport();

  // Initialize transaction status checker cron job
  scheduleTransactionStatusChecker();

  // Initialize paid orders Odoo opportunity cron job
  schedulePaidOrdersToOdooOpportunity();

  // Initialize paid subscription orders Mailchimp audience sync cron job
  // schedulePaidSubscriptionOrdersToMailchimp();

  // Initialize Mailchimp user sync cron job (every 24 hours)
  scheduleMailchimpUserSync();

  // Initialize all orders to Odoo contact sync cron job
  // scheduleAllOrdersToOdooContactSync();
};

export default initializeCronJobs;
