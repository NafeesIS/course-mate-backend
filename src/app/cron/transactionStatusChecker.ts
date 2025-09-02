import { subHours } from 'date-fns';
import cron from 'node-cron';
import Razorpay from 'razorpay';
import config from '../config';
import { DirectorModel } from '../modules/director/director.model';
import { DistributedLockService } from '../modules/distributedLock/distributedLock.service';
import { TransactionModel } from '../modules/transactions/transaction.model';
import { toTitleCase } from '../utils/dataFormatter';
import {
  sendEmailWithAzure,
  sendUnlockContactDetailsSMS,
} from '../utils/notification/notification';
import directorContactDetailsEmail from '../utils/notification/templates/directorContactDetailsEmail';

interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  email: string;
  contact: string;
  notes: Record<string, unknown>;
  created_at: number;
}

interface RazorpayPaymentsResponse {
  entity: string;
  count: number;
  items: RazorpayPayment[];
}

const razorpayInstance = new Razorpay({
  key_id: (config.FSEnvironment === 'development'
    ? config.razorpay_test_key_id
    : config.razorpay_key_id) as string,
  key_secret: (config.FSEnvironment === 'development'
    ? config.razorpay_test_key_secret
    : config.razorpay_key_secret) as string,
});

const checkPendingTransactions = async () => {
  const lockService = DistributedLockService.getInstance();
  const lockKey = 'transaction-status-checker-5min';

  try {
    // Try to acquire the lock with 4 minutes TTL (less than the cron interval)
    const hasLock = await lockService.acquireLock(lockKey, 240);
    if (!hasLock) {
      console.log('Another instance is already checking transactions. Skipping...');
      return;
    }

    // Get transactions from last 30 minutes that are still in 'created' status
    const thirtyMinutesAgo = subHours(new Date(), 0.5);
    const pendingTransactions = await TransactionModel.find({
      createdAt: { $gte: thirtyMinutesAgo },
      status: 'created',
    });

    console.log(`Found ${pendingTransactions.length} pending transactions`);

    for (const transaction of pendingTransactions) {
      try {
        // Check payment status with Razorpay
        const payments = (await razorpayInstance.orders.fetchPayments(
          transaction.orderId
        )) as RazorpayPaymentsResponse;

        if (payments.count === 0) {
          console.log(`No payments found for order ${transaction.orderId}`);
          continue;
        }

        // Get the latest payment
        const latestPayment = payments.items[0];

        // If payment is captured, update transaction and send director details
        if (latestPayment.status === 'captured') {
          // Update transaction status
          const updatedTransaction = await TransactionModel.findOneAndUpdate(
            { orderId: transaction.orderId },
            {
              $set: {
                status: 'paid',
                paymentId: latestPayment.id,
                email: latestPayment.email || null,
                phone: latestPayment.contact || null,
              },
            },
            { new: true }
          );

          if (!updatedTransaction) {
            console.error(`Failed to update transaction ${transaction.orderId}`);
            continue;
          }

          // Get director details
          const director = await DirectorModel.findOne(
            { din: transaction.serviceId },
            { mobileNumber: 1, emailAddress: 1, fullName: 1, din: 1 }
          );

          if (!director) {
            console.log(`Director not found for DIN: ${transaction.serviceId}`);
            continue;
          }

          // Send SMS with director's contact details
          if (updatedTransaction.phone) {
            // TODO: Implement SMS sending logic
            console.log(`Sending SMS to customer ${updatedTransaction.phone}`);
            await sendUnlockContactDetailsSMS(
              updatedTransaction.phone,
              director.din,
              toTitleCase(director.fullName),
              director.mobileNumber,
              director.emailAddress
            );
          }

          // Send email with director's contact details
          if (updatedTransaction.email && updatedTransaction.email !== 'void@razorpay.com') {
            const emailContent = directorContactDetailsEmail({
              directorName: director.fullName,
              directorMobile: director.mobileNumber,
              directorEmail: director.emailAddress,
              din: director.din,
              orderId: transaction.orderId,
              amount: transaction.amount / 100,
              currency: transaction.currency,
            });

            const ccEmail = ['nazrul@filesure.in', 'tushar@filesure.in'];
            await sendEmailWithAzure(
              updatedTransaction.email,
              'Director Contact Details - Filesure',
              emailContent,
              ccEmail
            );
          }
        }
      } catch (error) {
        console.error(`Error processing transaction ${transaction.orderId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in transaction status checker:', error);
  } finally {
    // Release the lock
    await lockService.releaseLock(lockKey);
  }
};

const scheduleTransactionStatusChecker = () => {
  if (config.FSEnvironment === 'production') {
    console.log('Transaction status checker cron job is starting in production environment.');

    // Run every 5 minutes
    cron.schedule('*/5 * * * *', checkPendingTransactions);

    console.log('Transaction status checker cron job scheduled to run every 5 minutes.');
  } else {
    console.log(
      'Transaction status checker cron job not started. FSEnvironment is not set to production.'
    );
  }
};

export default scheduleTransactionStatusChecker;
