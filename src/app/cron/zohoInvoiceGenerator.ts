import cron from 'node-cron';
import config from '../config';
import { DistributedLockService } from '../modules/distributedLock/distributedLock.service';
import {
  createCashfreeJournalsForDay,
  createRazorPayJournalsForDay,
  processPendingCashFreeZohoOrdersAndInvoices,
  processPendingRazorPayZohoOrdersAndInvoices,
} from '../modules/zoho/utils/zohoSalesOrderInvoice';

// Cron job to process pending Zoho invoices
const scheduleZohoInvoiceGeneration = () => {
  if (config.FSEnvironment === 'production') {
    console.log('Zoho invoice generator cron job is starting in production environment.');

    // Cron job to process pending invoices every hour
    cron.schedule('0 * * * *', async () => {
      console.log('=======>> Running hourly Zoho invoice generation job...');

      const lockService = DistributedLockService.getInstance();
      const lockKey = 'zoho-invoice-generation-hourly';

      try {
        // Try to acquire the lock with 20 minutes TTL to handle up to 30+ orders
        const hasLock = await lockService.acquireLock(lockKey, 1200); // 20 minutes TTL
        if (!hasLock) {
          console.log('Another instance is already processing Zoho invoices. Skipping...');
          return;
        }

        // Process pending Cashfree orders
        console.log('Processing pending Cashfree orders...');
        await processPendingCashFreeZohoOrdersAndInvoices();

        // Process pending Razorpay orders
        console.log('Processing pending Razorpay orders...');
        await processPendingRazorPayZohoOrdersAndInvoices();

        console.log('Zoho invoice generation job completed successfully.');
      } catch (error) {
        console.error('Error running Zoho invoice generation:', error);
      } finally {
        // Release the lock
        await lockService.releaseLock(lockKey);
      }
    });

    // Cron job to create settlement journals at 11:50 PM Indian time (18:20 UTC)
    cron.schedule('20 18 * * *', async () => {
      console.log(
        '=======>> Running daily settlement journal creation job at 11:50 PM Indian time (18:20 UTC)...'
      );

      const lockService = DistributedLockService.getInstance();
      const lockKey = 'zoho-settlement-journal-daily';

      try {
        // Try to acquire the lock with 15 minutes TTL for journal processing
        const hasLock = await lockService.acquireLock(lockKey, 900); // 15 minutes TTL
        if (!hasLock) {
          console.log('Another instance is already creating settlement journals. Skipping...');
          return;
        }

        // Create Razorpay settlement journals
        console.log('Creating Razorpay settlement journals...');
        await createRazorPayJournalsForDay();

        // Create Cashfree settlement journals
        console.log('Creating Cashfree settlement journals...');
        await createCashfreeJournalsForDay();

        console.log('Settlement journal creation job completed successfully.');
      } catch (error) {
        console.error('Error running settlement journal creation:', error);
      } finally {
        // Release the lock
        await lockService.releaseLock(lockKey);
      }
    });

    console.log('Zoho invoice generator cron job scheduled.');
  } else {
    console.log(
      'Zoho invoice generator cron job not started. FSEnvironment is not set to production.'
    );
  }
};

export default scheduleZohoInvoiceGeneration;
