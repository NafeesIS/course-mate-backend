import { endOfMonth, format, startOfMonth } from 'date-fns';
import { Document } from 'mongoose';
import cron from 'node-cron';
import { OrderModel } from '../modules/order/order.model';
import { TransactionModel } from '../modules/transactions/transaction.model';
import { IUser } from '../modules/user/user.interface';
import { sendEmailWithAzure } from '../utils/notification/notification';

interface DailySalesReport {
  date: string;
  totalOrders: number;
  successfulOrders: number;
  totalRevenue: number;
  totalRevenueWithGST: number;
  totalDiscount: number;
  averageOrderValue: number;
  serviceBreakdown: Record<string, { count: number; plans: Record<string, number> }>;
  paymentStatusBreakdown: Record<string, number>;
  geographicBreakdown: Record<string, number>;
  singleDirectorSales: number;
  topCustomers: Array<{
    name: string;
    email: string;
    orderCount: number;
    totalValue: number;
  }>;
  topProducts: Array<{
    serviceName: string;
    count: number;
    totalValue: number;
  }>;
}

// Helper function to format currency in Indian format
const formatIndianCurrency = (amount: number): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return formatter.format(amount);
};

const generateDailySalesReport = async () => {
  try {
    // Get current date in IST
    const now = new Date();

    // Calculate UTC times that correspond to the Indian day (UTC+5:30)
    // For Indian day of April 18th (00:00 to 23:59:59 IST)
    // We need April 17th 18:30 to April 18th 18:29:59 UTC

    // Start time: Previous day 18:30 UTC (equivalent to current day 00:00 IST)
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(18, 30, 0, 0);
    startOfDay.setUTCDate(startOfDay.getUTCDate() - 1);

    // End time: Current day 18:29:59.999 UTC (equivalent to current day 23:59:59.999 IST)
    const endOfDay = new Date(now);
    endOfDay.setUTCHours(18, 29, 59, 999);

    // For monthly data, calculate the start of month in UTC
    // If current IST is April 18th, we want UTC from March 31st 18:30
    const thisMonth = startOfMonth(now);
    // Then go back one month to get previous month
    thisMonth.setMonth(thisMonth.getMonth() - 1);
    // Get the last day of that month
    const monthStart = endOfMonth(thisMonth);
    // Set it to 18:30 UTC (midnight IST)
    monthStart.setUTCHours(18, 30, 0, 0);

    console.log('Daily Sales Report Query time ranges:', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
      monthStart: monthStart.toISOString(),
      currentTime: now.toISOString(),
    });

    // Fetch all orders from today with populated user data
    const orders = await OrderModel.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate('items.serviceId')
      .populate('userId');

    // Fetch all orders from this month for top customers with populated user data
    const monthlyOrders = await OrderModel.find({
      createdAt: {
        $gte: monthStart,
        $lte: endOfDay,
      },
      status: 'PAID',
    })
      .populate('items.serviceId')
      .populate('userId');

    // Fetch all transactions from today
    const transactions = await TransactionModel.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    // Initialize report object with Bangladesh date
    const report: DailySalesReport = {
      date: format(now, 'yyyy-MM-dd'), // Use local time for display
      totalOrders: orders.length + transactions.length,
      successfulOrders: 0,
      totalRevenue: 0,
      totalRevenueWithGST: 0,
      totalDiscount: 0,
      averageOrderValue: 0,
      serviceBreakdown: {},
      paymentStatusBreakdown: {},
      geographicBreakdown: {},
      singleDirectorSales: 0,
      topCustomers: [],
      topProducts: [],
    };

    // Process orders
    orders.forEach(order => {
      // Count payment status
      report.paymentStatusBreakdown[order.status] =
        (report.paymentStatusBreakdown[order.status] || 0) + 1;

      // If order is paid, add to revenue
      if (order.status === 'PAID') {
        report.successfulOrders++;
        report.totalRevenue += order.value;
        report.totalRevenueWithGST += order.value + (order.gst || 0);
        report.totalDiscount += order.discount_amount || 0;

        // Count services and plans
        order.items.forEach(item => {
          const serviceName = item.serviceName;
          if (!report.serviceBreakdown[serviceName]) {
            report.serviceBreakdown[serviceName] = { count: 0, plans: {} };
          }
          report.serviceBreakdown[serviceName].count++;

          // If it's a subscription, track the plan
          if (item.serviceType === 'subscription' && item.customAttributes?.plan) {
            const plan = item.customAttributes.plan;
            report.serviceBreakdown[serviceName].plans[plan] =
              (report.serviceBreakdown[serviceName].plans[plan] || 0) + 1;
          }
        });

        // Count geographic distribution
        if (order.billingDetails?.state) {
          report.geographicBreakdown[order.billingDetails.state] =
            (report.geographicBreakdown[order.billingDetails.state] || 0) + 1;
        }
      }
    });

    // Process single director transactions
    transactions.forEach(transaction => {
      // Normalize status to uppercase
      const normalizedStatus = transaction.status.toUpperCase();

      // Count payment status for transactions
      report.paymentStatusBreakdown[normalizedStatus] =
        (report.paymentStatusBreakdown[normalizedStatus] || 0) + 1;

      if (normalizedStatus === 'PAID') {
        report.successfulOrders++;
        // Convert amount from paisa to rupees
        const amountInRupees = transaction.amount / 100;
        report.totalRevenue += amountInRupees;
        report.totalRevenueWithGST += amountInRupees;

        // Add to service breakdown as Single Director Unlock
        const serviceName = 'Single Director Unlock';
        if (!report.serviceBreakdown[serviceName]) {
          report.serviceBreakdown[serviceName] = { count: 0, plans: {} };
        }
        report.serviceBreakdown[serviceName].count++;
      }
    });

    // Process monthly orders for top customers
    const customerMap = new Map<
      string,
      {
        email: string;
        name: string;
        orderCount: number;
        totalValue: number;
      }
    >();

    monthlyOrders.forEach(order => {
      if (!order.userId) return;

      // Get primary email from user's emails array
      const user = order.userId as unknown as Document & IUser;
      const email = user.emails[0] || 'N/A';
      const name =
        `${user.meta_data?.firstName || ''} ${user.meta_data?.lastName || ''}`.trim() || 'N/A';

      const customerKey = `${email}`;
      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          email,
          name,
          orderCount: 0,
          totalValue: 0,
        });
      }
      const customer = customerMap.get(customerKey)!;
      customer.orderCount++;
      customer.totalValue += order.value;
    });

    // Get top 5 customers
    report.topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    // Process monthly orders for top products
    const productMap = new Map<string, { count: number; totalValue: number }>();
    monthlyOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productMap.has(item.serviceName)) {
          productMap.set(item.serviceName, { count: 0, totalValue: 0 });
        }
        const product = productMap.get(item.serviceName)!;
        product.count++;
        product.totalValue += item.price || 0;
      });
    });

    // Get top 5 products
    report.topProducts = Array.from(productMap.entries())
      .map(([serviceName, stats]) => ({
        serviceName,
        count: stats.count,
        totalValue: stats.totalValue,
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    // Calculate average order value
    if (report.successfulOrders > 0) {
      report.averageOrderValue = report.totalRevenue / report.successfulOrders;
    }

    // Format the report for email
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">Daily Sales Report for ${report.date}</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Orders:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${report.totalOrders}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Successful Orders:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${report.successfulOrders}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Revenue:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">₹${formatIndianCurrency(report.totalRevenue)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Revenue (with GST):</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">₹${formatIndianCurrency(report.totalRevenueWithGST)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Discount Availed:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">₹${formatIndianCurrency(report.totalDiscount)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Average Order Value:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">₹${formatIndianCurrency(report.averageOrderValue)}</td>
          </tr>
        </table>

        <h3 style="color: #333; margin-top: 20px;">Service Breakdown</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5;">Service</th>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5;">Count</th>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5;">Plans</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(report.serviceBreakdown)
              .map(
                ([service, data]) => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${service}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${data.count}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">
                    ${Object.entries(data.plans)
                      .map(([plan, count]) => `${plan}: ${count}`)
                      .join('<br>')}
                  </td>
                </tr>
              `
              )
              .join('')}
          </tbody>
        </table>

        <h3 style="color: #333; margin-top: 20px;">Payment Status Breakdown</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5;">Status</th>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5;">Count</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(report.paymentStatusBreakdown)
              .map(
                ([status, count]) => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${status}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${count}</td>
                </tr>
              `
              )
              .join('')}
          </tbody>
        </table>

        <h3 style="color: #333; margin-top: 20px;">Geographic Distribution</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5;">State</th>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5;">Count</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(report.geographicBreakdown)
              .map(
                ([state, count]) => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${state}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${count}</td>
                </tr>
              `
              )
              .join('')}
          </tbody>
        </table>

        <h3 style="color: #333; margin-top: 20px;">Top 5 Customers This Month</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5;">Customer Name</th>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5;">Email</th>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5;">Order Count</th>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5;">Total Value</th>
            </tr>
          </thead>
          <tbody>
            ${report.topCustomers
              .map(
                customer => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${customer.name}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${customer.email}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${customer.orderCount}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">₹${formatIndianCurrency(customer.totalValue)}</td>
                </tr>
              `
              )
              .join('')}
          </tbody>
        </table>

        <h3 style="color: #333; margin-top: 20px;">Top 5 Products This Month</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5;">Product Name</th>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5;">Units Sold</th>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5;">Total Value</th>
            </tr>
          </thead>
          <tbody>
            ${report.topProducts
              .map(
                product => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${product.serviceName}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${product.count}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">₹${formatIndianCurrency(product.totalValue)}</td>
                </tr>
              `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    // Send email with the report using Azure Communication Services
    await sendEmailWithAzure(
      'nazrul@filesure.in',
      `Daily Sales Report - ${report.date}`,
      emailContent,
      ['admin@filesure.in', 'safayet@filesure.in', 'garima@filesure.in', 'ashfaq@filesure.in']
    );

    console.log(`Daily sales report generated for ${report.date}`);
  } catch (error) {
    console.error('Error generating daily sales report:', error);
  }
};

export const scheduleDailySalesReport = () => {
  // Schedule the job to run at 11:59 PM IST
  cron.schedule('59 23 * * *', generateDailySalesReport, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });
  console.log('Daily sales report cron job scheduled for 11:59 PM IST');
};
