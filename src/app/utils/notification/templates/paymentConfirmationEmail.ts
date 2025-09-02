import { TOrderItem } from '../../../modules/order/order.interface';
import { getCurrencySymbol } from '../../dataFormatter';

// interface OrderItem {
//   name: string;
//   price: number;
//   quantity: number;
//   serviceType: string;
//   customAttributes?: {
//     // Subscription-specific attributes
//     plan?: 'monthly' | 'quarterly' | 'annually'; // For subscription services
//     options?: string[]; // Array for additional options selected (optional)
//     includedStates?: string[]; // For state-specific subscription services
//     zone?: string; // Selected zone for zonal pricing services

//     // Director Unlock-specific attributes
//     bulkUnlockCredits?: number; // Number of credits for bulk director unlock
//     // [key: string]: any; // Allow additional attributes for future flexibility
//   };
//   // plan?: 'monthly' | 'quarterly' | 'annually';
//   // options?: string[]; // Array of option selected options
//   // includedStates?: string[];
// }

interface EmailData {
  orderId: string;
  items: TOrderItem[];
  totalAmount: number;
  currency: string;
  coupon?: {
    code: string;
    type: string;
    value: number;
    discount: number;
  };
  // subscriptionIds?: Schema.Types.ObjectId[];
}

const paymentConfirmationEmail = (data: EmailData) => {
  const { orderId, items, totalAmount, currency, coupon } = data;
  const currencySymbol = getCurrencySymbol(currency);
  const itemsList = items
    .map(
      item => `
    <tr>
      <td>${item.serviceName} ${item.serviceName === 'Bulk Unlock' ? `(${item.customAttributes?.bulkUnlockCredits} credits)` : ''}</td>
      <td>${item.quantity}</td>
      <td>${currencySymbol} ${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  let couponDetails = '';
  if (coupon) {
    couponDetails = `
      <p>Coupon Code: ${coupon.code}</p>
      <p>Discount Type: ${coupon.type}</p>
      <p>Discount Value: ${coupon.value}</p>
      <p>Discount Amount: ${coupon.discount}</p>
    `;
  }

  // const subscriptionInfo =
  //   subscriptionIds && subscriptionIds.length > 0
  //     ? `<p>Your subscription ID(s): </p>
  //      <div class="subscription-info">
  //           ${subscriptionIds.join(', ')}
  //       </div>`
  //     : '';

  const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4CAF50;
            color: white;
            text-align: center;
            padding: 20px;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 0 0 5px 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        .total {
            font-weight: bold;
            font-size: 1.1em;
        }
        .subscription-info {
            background-color: #e6f7ff;
            border: 1px solid #91d5ff;
            border-radius: 5px;
            padding: 10px;
            margin-top: 20px;
        }
    </style>
  </head>
  <body>
     <div class="header">
        <h1>Payment Confirmation</h1>
    </div>

    <div class="content">
      <p>Thank you for your purchase. Your payment has been successfully processed.</p>
      <p><strong>Order ID:</strong> ${orderId}</p>

      <h2>Order Details:</h2>
        <table>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Price</th>
          </tr>
          ${itemsList}
        </table>
        <p class="total">Total Amount: ${currencySymbol} ${totalAmount.toFixed(2)}</p>

        ${couponDetails}
        
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Thank you for your business!</p>
    </body>
  </html>
  `;

  return htmlContent;
};

export default paymentConfirmationEmail;
