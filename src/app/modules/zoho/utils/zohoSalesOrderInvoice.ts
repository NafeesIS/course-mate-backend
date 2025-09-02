/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */

import axios from 'axios';
import { getDate, getMonth, getUnixTime, getYear } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import config from '../../../config';
import { getZohoBookStateNameFromGstin } from '../../company/utils/helperFunctions';
import { TOrder } from '../../order/order.interface';
import { OrderModel } from '../../order/order.model';
import { SubscriptionModel } from '../../subscription/subscription.model';
import { TTransaction } from '../../transactions/transaction.interface';
import { TransactionModel } from '../../transactions/transaction.model';
import { UserModel } from '../../user/user.model';
import { getZohoBookAuthToken, makeZohoBookApiRequest } from '../zoho.helper';

interface ZohoItem {
  name: string;
  item_id: string;
  hsn_or_sac: string;
  description?: string;
}
interface ZohoInvoice {
  invoice_number: string;
  // Add other properties if needed
}

const getSeriesPrefix = async (currency: string, gstNumber?: string) => {
  // Get the current date
  const currentDate = new Date();

  // Check if the current month is April or later (from April to March next year)
  const currentYear = currentDate.getFullYear();
  let financialYearPrefix: string;

  if (currentDate.getMonth() >= 3) {
    // Current financial year is the current year and next year
    financialYearPrefix = `${currentYear}`.slice(2) + `${currentYear + 1}`.slice(2);
  } else {
    // If before April, we use the previous year as the financial year
    financialYearPrefix = `${currentYear - 1}`.slice(2) + `${currentYear}`.slice(2);
  }
  // Determine the prefix based on the currency and GST number
  if (currency === 'INR') {
    if (gstNumber) {
      return `B2B${financialYearPrefix}`; // GST Number: B2B
    } else {
      return `WEB${financialYearPrefix}`; // Non-GST Number: WEB
    }
  } else if (currency === 'USD') {
    return `INT${financialYearPrefix}`; // USD: INT
  } else {
    return `WEB${financialYearPrefix}`; // Default to WEB for other currencies
  }
};

const fetchOrCreateZohoCustomer = async (
  order: TOrder,
  zohoAuthToken: string,
  zohoApiBase: string,
  organizationId: string,
  phone: string,
  name: string,
  email: string,
  placeOfSupply: string
) => {
  let customerId = '';
  let companyName = '';
  let address = '';
  let city = '';
  let state = '';
  let postalCode = '';
  let country = '';
  let updatedBillingAddress = {};

  try {
    if (order.gstNumber) {
      // **🔹 Step 1: Try to find an existing customer in Zoho Books**
      const searchCustomerConfig = {
        method: 'get',
        url: `${zohoApiBase}/contacts?organization_id=${organizationId}&phone=${phone}`,
        headers: {
          Authorization: `Zoho-oauthtoken ${zohoAuthToken}`,
          'Content-Type': 'application/json',
        },
      };

      const searchCustomerResponse = await makeZohoBookApiRequest(searchCustomerConfig);

      if (searchCustomerResponse?.contacts?.length > 0) {
        // **✅ Found existing customer, return its ID**
        return searchCustomerResponse.contacts[0].contact_id;
      }

      // **🔹 Step 2: Fetch Company Details using GSTIN**
      const gstSearchUrl = `https://books.zoho.in/api/v3/search/gstin?gstin=${order.gstNumber}&organization_id=${organizationId}`;
      try {
        const tokenData = await getZohoBookAuthToken();
        const gstSearchResponse = await axios.get(gstSearchUrl, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
            Cookie: tokenData?.cookie,
          },
        });

        if (gstSearchResponse?.data?.data) {
          const pradr = gstSearchResponse.data.data.pradr;
          companyName =
            gstSearchResponse.data.data.tradeNam || gstSearchResponse.data.data.business_name;

          if (pradr?.addr) {
            address = [pradr.addr.bnm, pradr.addr.bno, pradr.addr.st]
              .filter(Boolean)
              .join(', ')
              .trim();
            city = pradr.addr.loc || '';
            state = pradr.addr.dst || '';
            postalCode = pradr.addr.pncd || '';
            country = 'India';
          }
        }
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          console.error('Error fetching GSTIN details:', error.response?.data || 'Unknown error');
        } else {
          console.error('Unexpected Error while fetching GSTIN details:', error.message);
        }
      }

      // **🔹 Step 3: Create New B2B Customer**
      updatedBillingAddress = {
        address,
        city,
        state,
        zip: postalCode,
        country,
        phone,
      };

      const createCustomerPayload = {
        contact_name: name,
        contact_persons: [
          {
            first_name: name,
            mobile: phone,
            phone: phone,
            email: email,
            is_primary_contact: true,
          },
        ],
        company_name: companyName,
        billing_address: updatedBillingAddress,
        gst_no: order.gstNumber,
        place_of_contact: placeOfSupply,
        gst_treatment: 'business_gst',
        is_taxable: true,
      };

      const createCustomerConfig = {
        method: 'post',
        url: `${zohoApiBase}/contacts?organization_id=${organizationId}`,
        headers: {
          Authorization: `Zoho-oauthtoken ${zohoAuthToken}`,
          'Content-Type': 'application/json',
        },
        data: createCustomerPayload,
      };

      const createCustomerResponse = await makeZohoBookApiRequest(createCustomerConfig);

      if (createCustomerResponse?.contact) {
        return createCustomerResponse.contact.contact_id;
      }
    }

    // **🔹 Step 4: B2C Customer (Fixed ID)**
    customerId = '2176308000000748222'; // Fixed B2C Customer ID
    updatedBillingAddress = {
      attention: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      country: '',
    };

    const updateCustomerConfig = {
      method: 'put',
      url: `${zohoApiBase}/contacts/${customerId}?organization_id=${organizationId}`,
      headers: {
        Authorization: `Zoho-oauthtoken ${zohoAuthToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        company_name: '',
        billing_address: updatedBillingAddress,
        contact_persons: [],
      },
    };

    await makeZohoBookApiRequest(updateCustomerConfig);

    return customerId;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('Error processing customer:', error.response?.data || 'Unknown error');
    } else {
      console.error('Unexpected Error processing customer:', error.message);
    }
  }
};

const generateNextInvoiceNumber = async (
  zohoBookBaseApi: string,
  organizationId: string,
  zohoAuthToken: string,
  seriesPrefix: string
) => {
  const getInvoiceConfig = {
    method: 'get',
    url: `${zohoBookBaseApi}/invoices?organization_id=${organizationId}&invoice_number_startswith=${encodeURIComponent(seriesPrefix)}&sort_column=created_time&sort_order=D&response_option=0&page=1`,
    headers: {
      Authorization: `Zoho-oauthtoken ${zohoAuthToken}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    // Step 1: Fetch Invoices from Zoho Books
    const getInvoiceResponse = await makeZohoBookApiRequest(getInvoiceConfig);

    const invoices: ZohoInvoice[] = getInvoiceResponse.invoices || [];
    if (invoices.length === 0) {
      const newInvoiceNumber = seriesPrefix + '00001';
      return newInvoiceNumber;
    }
    // Step 2: Filter Invoices by Series Prefix
    const seriesInvoices = invoices.filter(inv => inv.invoice_number.startsWith(seriesPrefix));

    // console.log('Filtered Series Invoices:', seriesInvoices);

    // Step 3: If Matching Invoices Exist
    if (seriesInvoices.length > 0) {
      // Sort the filtered invoices by invoice number (numeric part)
      seriesInvoices.sort((a, b) => {
        const numA = parseInt(a.invoice_number.slice(seriesPrefix.length));
        const numB = parseInt(b.invoice_number.slice(seriesPrefix.length));
        return numA - numB;
      });

      // Get the last invoice's numeric part and increment it
      const lastInvoice = seriesInvoices[seriesInvoices.length - 1];
      // console.log('Last Invoice:', lastInvoice);

      const lastNumber = parseInt(lastInvoice.invoice_number.slice(seriesPrefix.length));

      // Increment and format with leading zeros (assuming 5 digits)
      const newNumber = String(lastNumber + 1).padStart(5, '0');

      const newInvoiceNumber = `${seriesPrefix}${newNumber}`;

      return newInvoiceNumber;
    }
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error(
        'Failed to generate next invoice number:',
        error.response?.data || 'Unknown error'
      );
    } else {
      console.error('Unexpected Error & Failed to generate next invoice number:', error.message);
    }
  }
};

const fetchZohoItems = async (
  zohoBookBaseApi: string,
  organizationId: string,
  zohoAuthToken: string
) => {
  try {
    const searchConfig = {
      method: 'get',
      url: `${zohoBookBaseApi}/items?organization_id=${organizationId}`,
      headers: {
        Authorization: `Zoho-oauthtoken ${zohoAuthToken}`,
        'Content-Type': 'application/json',
      },
    };
    const response = await makeZohoBookApiRequest(searchConfig);
    return response.items;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error(
        'Failed to fetch items from Zoho Books:',
        error.response?.data || 'Unknown error'
      );
    } else {
      console.error('Unexpected Error & Failed to fetch items from Zoho Books:', error.message);
    }
  }
};
// Utility Function to Generate Custom Fields for Invoice Payload
const getCustomFields = async (
  customerType: string,
  contactNumber: string,
  email?: string,
  name?: string,
  paymentID?: string
) => {
  const fields = [
    {
      customfield_id: '2176308000000341663', // Customer Type
      value: customerType,
    },
    {
      customfield_id: '2176308000000837043', // Contact Number
      value: contactNumber,
    },
  ];

  if (email) {
    fields.push({
      customfield_id: '2176308000000346634', // Contact Person Email
      value: email,
    });
  }

  if (name) {
    fields.push({
      customfield_id: '2176308000000837019', // Contact Person Name
      value: name,
    });
  }

  if (paymentID) {
    fields.push({
      customfield_id: '2176308000000309005', // Payment ID
      value: paymentID,
    });
  }

  return fields;
};

const capitalize = (str: string) => `${str[0].toUpperCase()}${str.slice(1)}`;

const matchItems = async (order: TOrder, zohoItems: ZohoItem[]) => {
  const exchangeResponse = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
  const inrRate: number = exchangeResponse?.data?.rates?.INR || 85;
  const orderItems = order.items;
  const orderId = order.orderId;
  const subscription = await SubscriptionModel.findOne({ orderId: orderId });

  return orderItems.map(item => {
    let serviceName = '';

    // Subscription Service
    if (
      item.serviceType === 'subscription' &&
      item.customAttributes &&
      item.customAttributes.plan
    ) {
      const planName = capitalize(item.customAttributes.plan);
      const options = item.customAttributes.options;
      serviceName = item.serviceName.includes('Email Only')
        ? `${item.serviceName} (${planName})`
        : `${item.serviceName} (${options && options.join(' + ')} India - ${planName})`;
    }

    // Director Unlock Service
    if (
      item.serviceType === 'directorUnlock' &&
      item.customAttributes &&
      item.customAttributes.bulkUnlockCredits
    ) {
      const unlockedDirectorCredits = item.customAttributes.bulkUnlockCredits;
      serviceName = `Director Contact Unlock - Bulk (${unlockedDirectorCredits} Credits)`;
    }

    // Company Unlock Service
    if (
      item.serviceType === 'companyUnlock' &&
      item.customAttributes &&
      item.customAttributes.companyUnlockCredits
    ) {
      const unlockedCompanyCredits = item.customAttributes.companyUnlockCredits;
      serviceName =
        unlockedCompanyCredits === 1
          ? 'Unlock Company Data - Single'
          : `Unlock Company Data - Bulk (${unlockedCompanyCredits} Credits)`;
    }

    // VPD Unlock Service
    if (
      item.serviceType === 'vpdUnlock' &&
      item.customAttributes &&
      item.customAttributes.companyUnlockCredits
    ) {
      serviceName = 'Public Documents Download - Single';
    }
    const areNamesEquivalent = (nameA: string, nameB: string): boolean => {
      const normalize = (str: string) =>
        str
          .toLowerCase()
          .replace(/[()\-:+]/g, ' ')
          .split(/\s+/)
          .filter(Boolean)
          .sort()
          .join(' ');

      return normalize(nameA) === normalize(nameB);
    };

    // Find the corresponding item in Zoho Items
    const zohoItem = zohoItems.find(zi => {
      // console.log('Checking item:', {
      //   ziName: zi.name,
      //   serviceName,
      //   matched: areNamesEquivalent(zi.name, serviceName),
      // });
      return areNamesEquivalent(zi.name, serviceName);
    });

    if (!zohoItem) {
      throw new Error(`Item with name "${serviceName}" not found in Zoho Books.`);
    }

    const subscribedItemDescription = [
      subscription?.startDate
        ? `Plan Start Date: ${formatInTimeZone(subscription?.startDate, 'Asia/Kolkata', 'dd MMM yyyy')}`
        : null,
      subscription?.endDate
        ? `Plan End Date: ${formatInTimeZone(subscription?.endDate, 'Asia/Kolkata', 'dd MMM yyyy')}`
        : null,
    ]
      .filter(Boolean)
      .map(value => `\n${value}`)
      .join('');

    const unlockItemDescription = [
      item?.customAttributes?.companyId,
      item?.customAttributes?.companyName,
    ]
      .filter(Boolean)
      .map(value => `\n${value}`)
      .join('');

    const finalItemDescription =
      item.serviceType === 'subscription' ? subscribedItemDescription : unlockItemDescription;

    let rate = item.price;
    if (item.currency === 'USD') {
      rate = item.price * inrRate;
    }

    return {
      item_id: zohoItem.item_id,
      rate: rate,
      quantity: item.quantity,
      hsn_or_sac: zohoItem.hsn_or_sac,
      description: finalItemDescription,
    };
  });
};

const fetchRazorpayPaymentDetails = async (paymentId: string) => {
  try {
    // Make GET Request to Razorpay API
    const response = await axios.get(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      auth: {
        username: config.razorpay_key_id as string,
        password: config.razorpay_key_secret as string,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const paymentRate = response.data.base_amount;
    return paymentRate;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error(
        'Error fetching Razorpay payment details:',
        error.response?.data?.error || 'Unknown error'
      );
    } else {
      console.error('Unexpected Error while fetching razorpay payment:', error.message);
    }
  }
};

const matchItemsForRazorPay = async (zohoItems: ZohoItem[], transaction: TTransaction) => {
  const zohoItem = zohoItems.find(zi => zi.name === 'Director Contact Unlock - Single');
  const paymentId = transaction.paymentId;
  const newRate = await fetchRazorpayPaymentDetails(paymentId as string);
  const transactionRate = newRate / 100;
  return {
    item_id: zohoItem?.item_id,
    rate: transactionRate,
    quantity: 1,
    hsn_or_sac: zohoItem?.hsn_or_sac,
  };
};

const createZohoInvoiceForCashFreeOrder = async (order: TOrder) => {
  try {
    console.log(
      `Creating cashfree invoice for order: ${order.orderId} order date: ${formatInTimeZone(
        order.createdAt,
        'Asia/Kolkata',
        'yyyy-MM-dd'
      )}`
    );
    // Step 2: Update Billing Address with Priority Data
    const user = await UserModel.findById(order.userId);
    if (!user) {
      throw new Error(`User not found for user id: ${order.userId} and order id: ${order.orderId}`);
    }
    const orderId = order.orderId;
    const zohoAuthToken = await getZohoBookAuthToken();
    const organizationId = '60034416720';
    const zohoApiBase = 'https://www.zohoapis.in/books/v3';
    let name = '',
      email = '',
      phone = '';

    // Priority 1: Order Billing Details
    if (order.billingDetails) {
      name =
        `${order.billingDetails.firstName || ''} ${order.billingDetails.lastName || ''}`.trim();
      email = order.billingDetails.email || '';
      phone = order.billingDetails.mobileNumber || '';
    }

    // Priority 2: User Billing Details
    if (!name || !email || !phone) {
      const userBilling = user.billingDetails?.[0];
      if (userBilling) {
        name = name || `${userBilling.firstName || ''} ${userBilling.lastName || ''}`.trim();
        email = email || userBilling.email || '';
        phone = phone || userBilling.mobileNumber || '';
      }
    }

    // Priority 3: User Meta Data
    if (!name || !email || !phone) {
      name = name || `${user.meta_data?.firstName || ''} ${user.meta_data?.lastName || ''}`.trim();
      email = email || user.emails?.[0] || '';
      phone = phone || user.meta_data?.mobileNumber || '';
    }
    let placeOfSupply;
    if (order.gstNumber) {
      // customerId = '2176308000000279333'; // B2B Customer
      placeOfSupply = String(getZohoBookStateNameFromGstin(order.gstNumber.substring(0, 2)));
    }

    const zohoItems = await fetchZohoItems(
      zohoApiBase,
      organizationId,
      zohoAuthToken?.access_token as string
    );

    // Step 3: Match Items
    const lineItems = await matchItems(order, zohoItems);

    const paymentID = order.paymentId && order.currency === 'USD' ? order.paymentId : undefined;

    const customFields = await getCustomFields(
      // order.orderId,
      'Cashfree Customers', // You can change this to dynamic value if needed
      phone,
      email,
      name,
      paymentID
    );
    const seriesPrefix = await getSeriesPrefix(order.currency, order.gstNumber);

    const newInvoiceNumber = await generateNextInvoiceNumber(
      zohoApiBase,
      organizationId,
      zohoAuthToken?.access_token as string,
      seriesPrefix
    );
    if (!newInvoiceNumber) {
      throw new Error('Failed to generate next invoice number.');
    }
    const customerId = await fetchOrCreateZohoCustomer(
      order,
      zohoAuthToken?.access_token as string,
      zohoApiBase,
      organizationId,
      phone,
      name,
      email,
      placeOfSupply as string
    );
    const todayDate = new Date();
    // Step 4: Create Invoice
    const invoicePayload = {
      // salesorder_id: salesOrderId,
      // organization_id: organizationId,
      customer_id: customerId,
      invoice_number: newInvoiceNumber,
      line_items: lineItems,
      payment_terms: 15,
      date: formatInTimeZone(todayDate, 'Asia/Kolkata', 'yyyy-MM-dd'), // Format `createdAt` as YYYY-MM-DD
      due_date: formatInTimeZone(todayDate, 'Asia/Kolkata', 'yyyy-MM-dd'),
      reference_number: order.orderId,
      terms: 'Due on Receipt',
      custom_fields: customFields,
      discount: order.discount_amount ? order.discount_amount.toString() : '0',
      discount_type: 'entity_level',
      is_discount_before_tax: true,
      shipping_charge: 0,
      adjustment: 0,
      place_of_supply: order.gstNumber ? placeOfSupply : 'MH',
      is_inclusive_tax: false,
      gst_treatment:
        order.currency === 'USD'
          ? 'overseas'
          : customerId === '2176308000000748222'
            ? 'business_none'
            : 'business_gst',
    };

    const invoiceConfig = {
      method: 'post',
      url: `${zohoApiBase}/invoices?organization_id=${organizationId}`,
      headers: {
        Authorization: `Zoho-oauthtoken ${zohoAuthToken?.access_token}`,
        'Content-Type': 'application/json',
      },
      data: invoicePayload,
    };

    const invoiceResponse = await makeZohoBookApiRequest(invoiceConfig);
    // console.log('invoiceResponse', invoiceResponse);
    const invoiceId = invoiceResponse.invoice.invoice_id;
    // console.log('created invoice for order', order.orderId, 'with invoice id:', invoiceId);

    // Step 3: Mark Invoice as Paid

    const paymentPayload = {
      customer_id: customerId,
      payment_mode: 'Cashfree', // You can adjust this as needed
      date: formatInTimeZone(order.createdAt, 'Asia/Kolkata', 'yyyy-MM-dd'),
      amount: invoiceResponse.invoice.total,
      reference_number: order.orderId,
      payment_date: order.createdAt.toISOString().split('T')[0],
      invoices: [
        {
          invoice_id: invoiceId,
          amount_applied: invoiceResponse.invoice.total,
        },
      ],
      account_id: '2176308000000037087',
    };

    const paymentConfig = {
      method: 'post',
      url: `${zohoApiBase}/customerpayments?organization_id=${organizationId}`,
      headers: {
        Authorization: `Zoho-oauthtoken ${zohoAuthToken?.access_token}`,
        'Content-Type': 'application/json',
      },
      data: paymentPayload,
    };
    await makeZohoBookApiRequest(paymentConfig);
    // const paymentResponse = await makeZohoBookApiRequest(paymentConfig);

    // console.log('paymentResponse', paymentResponse);
    const TodayIST = formatInTimeZone(todayDate, 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
    // Step 6: Update Order in Database
    await OrderModel.updateOne(
      { orderId },
      {
        $set: {
          isZohoInvoiceCreated: true,
          invoiceNumber: newInvoiceNumber,
          invoiceDate: new Date(TodayIST),
        },
      }
    );
    // Step 7: send invoice email to client
    if (email !== '') {
      const sendInvoiceEmailPayload = {
        to_mail_ids: [email],
        cc_mail_ids: ['admin@filesure.in', 'nafees@filesure.in'],
        subject: `Filesure Invoice ${invoiceResponse.invoice.invoice_number}`,
        body: `Dear ${name.toUpperCase()},\n\nThank you for your purchase.\n\nPlease find the invoice for your recent transaction attached with this email.\n\nIf you have any questions or need assistance, feel free to contact us:\n\nPhone: +91 81049 46419\nEmail: helpdesk@filesure.in\n\nBest Regards,\nFileSure India Private Limited`,
      };

      const sendInvoiceEmailConfig = {
        method: 'post',
        url: `${zohoApiBase}/invoices/${invoiceId}/email?organization_id=${organizationId}`,
        headers: {
          Authorization: `Zoho-oauthtoken ${zohoAuthToken?.access_token}`,
          'Content-Type': 'application/json',
        },
        data: sendInvoiceEmailPayload,
      };

      await makeZohoBookApiRequest(sendInvoiceEmailConfig);
    }
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('Error creating cashfree invoice:', error.response?.data || 'Unknown error');
    } else {
      console.error('Unexpected Error creating cashfree invoice:', error.message);
    }
    throw new Error(`Failed to create cashfree invoice for the order ${order.orderId}`);
  }
};

const createZohoInvoiceForRazorpayOrder = async (transaction: TTransaction) => {
  try {
    console.log(
      `Creating razorpay invoice for transaction: ${transaction.orderId} order date: ${formatInTimeZone(
        transaction.created_at * 1000,
        'Asia/Kolkata',
        'yyyy-MM-dd'
      )}`
    );
    const zohoAuthToken = await getZohoBookAuthToken();
    const organizationId = '60034416720';
    const zohoApiBase = 'https://www.zohoapis.in/books/v3';

    // Determine customer based on gstNumber
    const customerId = '2176308000000726614';

    // Step 3: Fetch Items and Prepare Line Items
    const fetchItemsConfig = {
      method: 'get',
      url: `${zohoApiBase}/items?organization_id=${organizationId}`,
      headers: {
        Authorization: `Zoho-oauthtoken ${zohoAuthToken?.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    const zohoItemsResponse = await makeZohoBookApiRequest(fetchItemsConfig);
    const zohoItems = zohoItemsResponse.items;
    const lineItems = await matchItemsForRazorPay(zohoItems, transaction);

    const updatedBillingAddress = {
      // attention,
      address: '',
      city: '',
      state: '',
      zip: '',
      country: '',
    };

    const updateCustomerConfig = {
      method: 'put',
      url: `${zohoApiBase}/contacts/${customerId}?organization_id=${organizationId}`,
      headers: {
        Authorization: `Zoho-oauthtoken ${zohoAuthToken?.access_token}`,
        'Content-Type': 'application/json',
      },
      data: {
        billing_address: updatedBillingAddress,
        company_name: '',
        country: '',
      },
    };

    await makeZohoBookApiRequest(updateCustomerConfig);
    const transactionEmail =
      transaction.email && transaction.email !== 'void@razorpay.com'
        ? transaction.email
        : undefined;
    const transactionName = transaction.name ? transaction.name : undefined;
    const paymentID =
      transaction.paymentId && transaction.currency === 'USD' ? transaction.paymentId : undefined;

    const customFields = await getCustomFields(
      'Razorpay Customers',
      transaction.phone,
      transactionEmail,
      transactionName,
      paymentID
    );
    const seriesPrefix = await getSeriesPrefix(transaction.currency);
    const newInvoiceNumber = await generateNextInvoiceNumber(
      zohoApiBase,
      organizationId,
      zohoAuthToken?.access_token as string,
      seriesPrefix
    );
    if (!newInvoiceNumber) {
      throw new Error('Failed to generate next invoice number.');
    }
    const todayDate = new Date();
    // Step 4: Create Invoice
    const invoicePayload = {
      // salesorder_id: salesOrderId,
      // organization_id: organizationId,
      customer_id: customerId,
      date: formatInTimeZone(todayDate, 'Asia/Kolkata', 'yyyy-MM-dd'),
      due_date: formatInTimeZone(todayDate, 'Asia/Kolkata', 'yyyy-MM-dd'),
      invoice_number: newInvoiceNumber,
      line_items: [lineItems],
      payment_terms: 15,
      reference_number: transaction.orderId,
      custom_fields: customFields,
      place_of_supply: 'MH',
      is_inclusive_tax: true,
      gst_treatment: transaction.currency === 'USD' ? 'overseas' : 'business_none',
    };
    // console.log('invoicePayload', invoicePayload);
    const invoiceConfig = {
      method: 'post',
      url: `${zohoApiBase}/invoices?organization_id=${organizationId}`,
      headers: {
        Authorization: `Zoho-oauthtoken ${zohoAuthToken?.access_token}`,
        'Content-Type': 'application/json',
      },
      data: invoicePayload,
    };

    const invoiceResponse = await makeZohoBookApiRequest(invoiceConfig);
    // console.log('invoiceResponse', invoiceResponse);
    const invoiceId = invoiceResponse.invoice.invoice_id;

    // const updateSalesOrderInvoiceStatusConfig = {
    //   method: 'post',
    //   url: `${zohoApiBase}/salesorders/${salesOrderId}/status/open?organization_id=${organizationId}`,
    //   headers: {
    //     Authorization: `Zoho-oauthtoken ${zohoAuthToken?.accessToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   data: {
    //     status: 'invoiced', // Pass the status in JSON format
    //   },
    // };

    // await makeZohoBookApiRequest(updateSalesOrderInvoiceStatusConfig);

    // Step 3: Mark Invoice as Paid

    const paymentPayload = {
      customer_id: customerId,
      payment_mode: 'Razorpay', // You can adjust this as needed
      date: formatInTimeZone(transaction.created_at * 1000, 'Asia/Kolkata', 'yyyy-MM-dd'),
      amount: invoiceResponse.invoice.total,
      reference_number: transaction.orderId,
      payment_date: new Date(transaction.created_at * 1000).toISOString().split('T')[0],
      invoices: [
        {
          invoice_id: invoiceId,
          amount_applied: invoiceResponse.invoice.total,
        },
      ],
      account_id: '2176308000000037093',
    };

    const paymentConfig = {
      method: 'post',
      url: `${zohoApiBase}/customerpayments?organization_id=${organizationId}`,
      headers: {
        Authorization: `Zoho-oauthtoken ${zohoAuthToken?.access_token}`,
        'Content-Type': 'application/json',
      },
      data: paymentPayload,
    };
    await makeZohoBookApiRequest(paymentConfig);
    // const paymentResponse = await makeZohoBookApiRequest(paymentConfig);

    // console.log('paymentResponse', paymentResponse);
    const TodayIST = formatInTimeZone(todayDate, 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
    const orderId = transaction.orderId;
    // Step 6: Update Order in Database
    await TransactionModel.updateOne(
      { orderId },
      {
        $set: {
          isZohoInvoiceCreated: true,
          invoiceNumber: newInvoiceNumber,
          invoiceDate: new Date(TodayIST),
        },
      }
    );
    // Step 7: send invoice email to client email
    if (transactionEmail) {
      const sendInvoiceEmailPayload = {
        to_mail_ids: [transaction.email],
        cc_mail_ids: ['admin@filesure.in', 'nafees@filesure.in'],
        subject: `Filesure Invoice ${invoiceResponse.invoice.invoice_number}`,
        body: `Dear ${transactionName ? transactionName.toUpperCase() : 'Customer'},\n\nThank you for your purchase.\n\nPlease find the invoice for your recent transaction attached with this email.\n\nIf you have any questions or need assistance, feel free to contact us:\n\nPhone: +91 81049 46419\nEmail: helpdesk@filesure.in\n\nBest Regards,\nFileSure India Private Limited`,
      };

      const sendInvoiceEmailConfig = {
        method: 'post',
        url: `${zohoApiBase}/invoices/${invoiceId}/email?organization_id=${organizationId}`,
        headers: {
          Authorization: `Zoho-oauthtoken ${zohoAuthToken?.access_token}`,
          'Content-Type': 'application/json',
        },
        data: sendInvoiceEmailPayload,
      };

      await makeZohoBookApiRequest(sendInvoiceEmailConfig);
    }

    // console.log(`Invoice sent successfully to ${emailResponse}`);
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('Error creating Razorpay invoice:', error.response?.data || 'Unknown error');
    } else {
      console.error('Unexpected Error creating Razorpay invoice:', error.message);
    }
    throw new Error(`Failed to create Razorpay invoice for the order ${transaction.orderId}`);
  }
};

export const processPendingCashFreeZohoOrdersAndInvoices = async () => {
  try {
    const pendingInvoices = await OrderModel.find({
      $and: [
        {
          $or: [
            { isZohoInvoiceCreated: false },
            { isZohoInvoiceCreated: { $exists: false } }, // Includes missing field
          ],
        },
        { status: 'PAID' }, // Ensure the order is marked as paid
        // { currency: 'INR' },
        // {
        //   createdAt: {
        //     $gte: new Date('2025-04-02T00:00:00.000+00:00'),
        //     $lte: new Date('2025-04-10T23:59:59.999+00:00'),
        //   },
        // },
      ],
    }).sort({ createdAt: 1 }); // Oldest first

    console.log(`Found ${pendingInvoices.length} pending Cashfree invoices. Processing...`);

    if (!pendingInvoices || pendingInvoices.length === 0) {
      console.log('No pending Cashfree invoices found.');
      return;
    }

    const failedOrders = [];

    for (const order of pendingInvoices) {
      try {
        await createZohoInvoiceForCashFreeOrder(order);
        // console.log(`Successfully processed order ${order.orderId}`);
      } catch (error: any) {
        const errorMessage = axios.isAxiosError(error)
          ? error.response?.data?.message || 'Unknown error'
          : error.message;

        console.error(`Failed to process order ${order.orderId}:`, errorMessage);
        failedOrders.push({
          orderId: order.orderId,
          error: errorMessage,
        });
      }
    }

    if (failedOrders.length > 0) {
      console.log('\nFailed Orders Summary:');
      failedOrders.forEach(({ orderId, error }) => {
        console.log(`Order ${orderId}: ${error}`);
      });
    }

    console.log(
      `\nProcessing complete. Successfully processed ${pendingInvoices.length - failedOrders.length} orders. Failed: ${failedOrders.length} orders.`
    );
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return console.error(
        'Zoho Error in processing pending Cashfree invoices:',
        error.response?.data?.message || 'Unknown error'
      );
    } else {
      return console.error(
        'Unexpected Error in processing pending Cashfree invoices:',
        error.message
      );
    }
  }
};

export const processPendingRazorPayZohoOrdersAndInvoices = async () => {
  try {
    const pendingInvoices = await TransactionModel.find({
      $and: [
        {
          $or: [
            { isZohoInvoiceCreated: false },
            { isZohoInvoiceCreated: { $exists: false } }, // Includes missing field
          ],
        },
        { status: 'paid' }, // Ensure the order is marked as paid
        // {
        //   createdAt: {
        //     $gte: new Date('2025-04-02T00:00:00.000+00:00'),
        //     $lte: new Date('2025-04-16T23:59:59.999+00:00'),
        //   },
        // },
      ],
    }).sort({ createdAt: 1 }); // Oldest first

    console.log(`Found ${pendingInvoices.length} pending Razorpay invoices. Processing...`);

    if (!pendingInvoices || pendingInvoices.length === 0) {
      console.log('No pending Razorpay invoices found.');
      return;
    }
    // Process pending invoices

    const failedOrders = [];
    for (const order of pendingInvoices) {
      try {
        await createZohoInvoiceForRazorpayOrder(order);
        // console.log(`Successfully processed order ${order.orderId}`);
      } catch (error: any) {
        const errorMessage = axios.isAxiosError(error)
          ? error.response?.data?.message || 'Unknown error'
          : error.message;

        console.error(`Failed to process order ${order.orderId}:`, errorMessage);
        failedOrders.push({
          orderId: order.orderId,
          error: errorMessage,
        });
      }
    }

    if (failedOrders.length > 0) {
      console.log('\nFailed Orders Summary:');
      failedOrders.forEach(({ orderId, error }) => {
        console.log(`Order ${orderId}: ${error}`);
      });
    }

    console.log(
      `\nProcessing complete. Successfully processed ${pendingInvoices.length - failedOrders.length} orders. Failed: ${failedOrders.length} orders.`
    );

    // console.log('All pending orders and invoices processed successfully.');
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return console.error(
        'Zoho Error in processing pending Razorpay invoices:',
        error.response?.data?.message || 'Unknown error'
      );
    } else {
      return console.error(
        'Unexpected Error in processing pending Razorpay invoices:',
        error.message
      );
    }
  }
};

export const createRazorPayJournalsForDay = async () => {
  const zohoAuthToken = await getZohoBookAuthToken();
  const organizationId = '60034416720';
  const zohoApiBase = 'https://www.zohoapis.in/books/v3';
  const targetDate = new Date();

  const startDate = formatInTimeZone(targetDate, 'Asia/Kolkata', "yyyy-MM-dd'T'00:00:00+05:30");
  const endDate = formatInTimeZone(targetDate, 'Asia/Kolkata', "yyyy-MM-dd'T'23:59:59+05:30");
  // Convert to Unix timestamps
  const startUnix = getUnixTime(startDate);
  const endUnix = getUnixTime(endDate);
  const onDemandRazorpayURL = `https://api.razorpay.com/v1/settlements/ondemand/?expand[]=ondemand_payouts&from=${startUnix}&to=${endUnix}&count=100`;
  // eslint-disable-next-line quotes
  const targetDateIST = formatInTimeZone(targetDate, 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ssXXX");
  const year = getYear(targetDateIST);
  const month = getMonth(targetDateIST) + 1; // 0-based index
  const day = getDate(targetDateIST);

  const razorpayURL = `https://api.razorpay.com/v1/settlements/recon/combined?year=${year}&month=${month}&day=${day}`;

  try {
    const response = await axios.get(razorpayURL, {
      auth: {
        username: config.razorpay_key_id as string,
        password: config.razorpay_key_secret as string,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const onDemandResponse = await axios.get(onDemandRazorpayURL, {
      auth: {
        username: config.razorpay_key_id as string,
        password: config.razorpay_key_secret as string,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const settlements = response.data.items || [];
    const onDemandSettlements = onDemandResponse.data.items || [];

    if (onDemandSettlements.length > 0) {
      const sortedNewOnDemandSettlements = [...onDemandSettlements].sort(
        (a, b) => Number(a.created_at) - Number(b.created_at)
      );

      for (const newDemandEntry of sortedNewOnDemandSettlements) {
        const onDemandPayouts = newDemandEntry.ondemand_payouts.items;
        for (const demandEntry of onDemandPayouts) {
          if (demandEntry.status === 'processed') {
            const hdfcAmount = demandEntry.amount_settled / 100;
            // const prepaidExpensesAmount = demandEntry.fees / 100;
            // const debitAmount = demandEntry.amount / 100;

            const onDemandLineItems = [
              {
                account_id: '2176308000000984005',
                debit_or_credit: 'debit',
                amount: hdfcAmount,
              },
              // {
              //   account_id: '2176308000000028011',
              //   debit_or_credit: 'debit',
              //   amount: prepaidExpensesAmount,
              // },
              {
                account_id: '2176308000000037093',
                debit_or_credit: 'credit',
                amount: hdfcAmount,
              },
            ];

            const onDemandPayload = {
              journal_date: formatInTimeZone(
                demandEntry.created_at * 1000,
                'Asia/Kolkata',
                'yyyy-MM-dd'
              ),
              reference_number: demandEntry.utr,
              journal_type: 'both',
              line_items: onDemandLineItems,
              notes: `Auto Journal for Razorpay On Demand Settlement on ${formatInTimeZone(demandEntry.created_at * 1000, 'Asia/Kolkata', 'yyyy-MM-dd')} with ${newDemandEntry.id}`,
            };

            const onDemandRequest = {
              method: 'post',
              url: `${zohoApiBase}/journals?organization_id=${organizationId}`,
              headers: {
                Authorization: `Zoho-oauthtoken ${zohoAuthToken?.access_token}`,
                'Content-Type': 'application/json',
              },
              data: onDemandPayload,
            };

            try {
              const journalRes = await makeZohoBookApiRequest(onDemandRequest);
              console.log(
                'On Demand Journal Created For Razorpay',
                journalRes.journal.reference_number
              );
            } catch (error: any) {
              if (axios.isAxiosError(error)) {
                console.error(
                  'Creating On Demand Journal for Razorpay Failed:',
                  error.response?.data || 'Unknown error'
                );
              } else {
                console.error(
                  'Unexpected Error While Creating On Demand Journal for Razorpay:',
                  error?.message
                );
              }
            }
          }
        }
      }
    }
    if (settlements.length === 0) {
      console.log(`No Razorpay normal settlements found for ${targetDateIST}`);
      return;
    }
    // Step 1: Group settlements by unique settlement_id + settlement_utr
    const groupedSettlements = new Map();

    for (const entry of settlements) {
      const key = `${entry.settlement_id}__${entry.settlement_utr}`;
      if (!groupedSettlements.has(key)) {
        groupedSettlements.set(key, []);
      }
      groupedSettlements.get(key).push(entry);
    }
    // console.log({ groupedSettlements });
    // Step 2: Loop through each group
    for (const group of groupedSettlements.values()) {
      const { settlement_id, settlement_utr, settled_at } = group[0];

      let salesAmount = 0;
      let onDemandCreditAmount = 0;
      let onDemandDebitAmount = 0;
      let walletUSDSettledPaypalAmount = 0;
      let walletINRFees = 0;
      let regularSettlementFees = 0;

      for (const entry of group) {
        salesAmount += entry.amount || 0;

        if (entry.type === 'settlement.ondemand') {
          onDemandCreditAmount += entry.amount || 0;
          onDemandDebitAmount += entry.debit || 0;
        }

        if (entry.method === 'wallet' && entry.credit === 0) {
          walletUSDSettledPaypalAmount += entry.amount || 0;
        }

        if (entry.method === 'wallet' && entry.credit !== 0) {
          walletINRFees += entry.fee || 0;
        }

        if (
          entry.type !== 'settlement.ondemand' &&
          entry.method !== 'wallet' &&
          entry.credit !== 0
        ) {
          regularSettlementFees += entry.fee || 0;
        }
      }

      const netSalesAmount = salesAmount / 100;
      const netOnDemandAmount = onDemandCreditAmount / 100;
      const netPaypalWalletUSD = walletUSDSettledPaypalAmount / 100;
      const netOnDemandDebit = onDemandDebitAmount / 100;
      const netRegularFees = regularSettlementFees / 100;
      const netWalletINRFees = walletINRFees / 100;

      const totalSalesAmount = netSalesAmount - (netOnDemandAmount + netPaypalWalletUSD);
      const razorpayReceivable = totalSalesAmount - netOnDemandDebit;
      const prepaidExpenses = netRegularFees + netWalletINRFees;
      const hdfcReceivable = razorpayReceivable - prepaidExpenses;

      const mainJournalLineItems = [
        {
          account_id: '2176308000000984005',
          debit_or_credit: 'debit',
          amount: hdfcReceivable,
        },
        // {
        //   account_id: '2176308000000028011',
        //   debit_or_credit: 'debit',
        //   amount: prepaidExpenses,
        // },
        {
          account_id: '2176308000000037093',
          debit_or_credit: 'credit',
          amount: hdfcReceivable,
        },
      ];

      const mainJournalPayload = {
        journal_date: formatInTimeZone(settled_at * 1000, 'Asia/Kolkata', 'yyyy-MM-dd'),
        reference_number: settlement_utr,
        journal_type: 'both',
        line_items: mainJournalLineItems,
        notes: `Auto Journal for Razorpay Settlement on ${formatInTimeZone(
          settled_at * 1000,
          'Asia/Kolkata',
          'yyyy-MM-dd'
        )} with ${settlement_id}`,
      };

      const mainJournalRequest = {
        method: 'post',
        url: `${zohoApiBase}/journals?organization_id=${organizationId}`,
        headers: {
          Authorization: `Zoho-oauthtoken ${zohoAuthToken?.access_token}`,
          'Content-Type': 'application/json',
        },
        data: mainJournalPayload,
      };

      try {
        const journalResponse = await makeZohoBookApiRequest(mainJournalRequest);
        console.log(
          `Journal Created for Razorpay settlement:`,
          journalResponse.journal.reference_number
        );
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          console.error(
            'Creating Journal for Razorpay Failed:',
            error.response?.data || 'Unknown error'
          );
        } else {
          console.error('Unexpected Error:', error?.message);
        }
      }
    }
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error(
        'Razorpay settlement fetch failed:',
        error.response?.data?.error || 'Unknown error'
      );
      return;
    } else {
      console.error('Unexpected Error while fetching razorpay settlement:', error.message);
      return;
    }
  }
};

export const createCashfreeJournalsForDay = async () => {
  const zohoAuthToken = await getZohoBookAuthToken();
  const organizationId = '60034416720';
  const zohoApiBase = 'https://www.zohoapis.in/books/v3';

  // Get current date in UTC
  const dateNowUTC = new Date();

  const startDate = formatInTimeZone(dateNowUTC, 'Asia/Kolkata', "yyyy-MM-dd'T'00:00:00+05:30");
  const endDate = formatInTimeZone(dateNowUTC, 'Asia/Kolkata', "yyyy-MM-dd'T'23:59:59+05:30");

  try {
    const response = await axios.post(
      'https://api.cashfree.com/pg/settlements',
      {
        pagination: {
          cursor: null,
          limit: 100,
        },
        filters: {
          start_date: startDate,
          end_date: endDate,
        },
      },
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-api-version': '2023-08-01',
          'x-client-id': config.cashFree_live_ID,
          'x-client-secret': config.cashFree_live_secretKey,
        },
      }
    );

    if (response.data.data.length === 0) {
      console.log(
        `No Cashfree settlements found for ${formatInTimeZone(dateNowUTC, 'Asia/Kolkata', 'yyyy-MM-dd')}`
      );
      return;
    }

    const settlements = response.data.data;

    for (const settlement of settlements) {
      if (settlement.status === 'PAID') {
        const { settlement_date, settlement_utr, cf_settlement_id } = settlement;
        let hdfcAmount = 0;
        // let prepaidCostAmount = 0;
        let notes;
        const cashFreeReceivedAmount = settlement.payment_amount + settlement.adjustment;

        if (settlement.settlement_type === 'OD_SETTLEMENT') {
          const settlementCharge = settlement.settlement_charge ?? 0;
          const settlementTax = settlement.settlement_tax ?? 0;
          notes = `Auto Journal for Cashfree On Demand Settlement on ${formatInTimeZone(settlement_date, 'Asia/Kolkata', 'yyyy-MM-dd')} with UTR ${settlement_utr}`;
          hdfcAmount = cashFreeReceivedAmount - (settlementCharge + settlementTax);
          // prepaidCostAmount = settlementCharge + settlementTax;
        } else {
          // const serviceCharge = settlement.service_charge ?? 0;
          // const serviceTax = settlement.service_tax ?? 0;
          notes = `Auto Journal for Cashfree Settlement on ${formatInTimeZone(settlement_date, 'Asia/Kolkata', 'yyyy-MM-dd')} with UTR ${settlement_utr}`;
          hdfcAmount = settlement.amount_settled;
          // prepaidCostAmount = serviceCharge + serviceTax;
        }
        const line_items = [
          {
            account_id: '2176308000000984005',
            debit_or_credit: 'debit',
            amount: hdfcAmount,
          },
          // {
          //   account_id: '2176308000000028011',
          //   debit_or_credit: 'debit',
          //   amount: prepaidCostAmount,
          // },
          {
            account_id: '2176308000000037087',
            debit_or_credit: 'credit',
            amount: hdfcAmount,
          },
        ];

        const journalPayload = {
          journal_date: formatInTimeZone(settlement_date, 'Asia/Kolkata', 'yyyy-MM-dd'),
          reference_number: `${cf_settlement_id}`,
          journal_type: 'both',
          line_items,
          notes: notes,
        };

        const config = {
          method: 'post',
          url: `${zohoApiBase}/journals?organization_id=${organizationId}`,
          headers: {
            Authorization: `Zoho-oauthtoken ${zohoAuthToken?.access_token}`,
            'Content-Type': 'application/json',
          },
          data: journalPayload,
        };

        try {
          const journalRes = await makeZohoBookApiRequest(config);
          console.log(
            `Journal Created for Cashfree settlement:`,
            journalRes.journal.reference_number
          );
        } catch (error: any) {
          if (axios.isAxiosError(error)) {
            console.error(
              'Creating Journal for Cashfree Failed:',
              error.response?.data || 'Unknown error'
            );
          } else {
            console.error('Unexpected Error:', error?.message);
          }
        }
      }
    }
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error(
        'Cashfree settlement fetch failed:',
        error.response?.data?.message || 'Unknown error'
      );
      return;
    } else {
      console.error('Unexpected Error while fetching Cashfree settlement:', error.message);
      return;
    }
  }
};

// export const simulateJournalCreationForDateRange = async () => {
//   const startDate = new Date('2025-04-01T18:20:00.000Z'); // 11:50 PM IST on April 1st, 2025
//   const endDate = new Date('2025-04-04T18:20:00.000Z'); // 11:50 PM IST on April 16th, 2025

//   let currentDate = new Date(startDate);
//   console.log('currentDate', currentDate);

//   while (currentDate <= endDate) {
//     console.log(
//       `\n🔄 Processing journals for ${formatInTimeZone(currentDate, 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss')}`
//     );

//     try {
//       // Create Razorpay journals
//       await createRazorPayJournalsForDay(currentDate);
//       console.log('✅ Razorpay journals created successfully');

//       // Create Cashfree journals
//       await createCashfreeJournalsForDay(currentDate);
//       console.log('✅ Cashfree journals created successfully');
//     } catch (error) {
//       console.error(
//         `Error processing journals for ${formatInTimeZone(currentDate, 'Asia/Kolkata', 'yyyy-MM-dd')}:`,
//         error
//       );
//     }

//     // Move to next day at 11:50 PM IST
//     currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
//   }

//   console.log('\n✨ Journal creation simulation completed for the specified date range');
// };

// export const createNewRazorPayJournalsForDay = async () => {
//   const zohoAuthToken = await getZohoBookAuthToken();
//   const organizationId = '60034416720';
//   const zohoApiBase = 'https://www.zohoapis.in/books/v3';
//   const targetDate = new Date();

//   const startDate = formatInTimeZone(targetDate, 'Asia/Kolkata', "yyyy-MM-dd'T'00:00:00+05:30");
//   const endDate = formatInTimeZone(targetDate, 'Asia/Kolkata', "yyyy-MM-dd'T'23:59:59+05:30");
//   // Convert to Unix timestamps
//   const startUnix = getUnixTime(startDate);
//   const endUnix = getUnixTime(endDate);
//   // eslint-disable-next-line quotes
//   const targetDateIST = formatInTimeZone(targetDate, 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ssXXX");
//   const razorpayURL = `https://api.razorpay.com/v1/settlements/ondemand/?expand[]=ondemand_payouts&from=${startUnix}&to=${endUnix}&count=100`;
//   try {
//     const response = await axios.get(razorpayURL, {
//       auth: {
//         username: config.razorpay_key_id as string,
//         password: config.razorpay_key_secret as string,
//       },
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     const settlements = response.data.items || [];
//     if (settlements.length === 0) {
//       console.log(`No Razorpay settlements found for ${targetDateIST}`);
//       return;
//     }

//     const newOnDemandSettlements = settlements.filter(
//       (item: any) => item.entity === 'settlement.ondemand'
//     );

//     const sortedNewOnDemandSettlements = [...newOnDemandSettlements].sort(
//       (a, b) => Number(a.created_at) - Number(b.created_at)
//     );

//     for (const newDemandEntry of sortedNewOnDemandSettlements) {
//       const onDemandPayouts = newDemandEntry.ondemand_payouts.items;
//       for (const demandEntry of onDemandPayouts) {
//         if (demandEntry.status === 'processed') {
//           const hdfcAmount = demandEntry.amount_settled / 100;
//           const prepaidExpensesAmount = demandEntry.fees / 100;
//           const debitAmount = demandEntry.amount / 100;

//           const onDemandLineItems = [
//             {
//               account_id: '2176308000000984005',
//               debit_or_credit: 'debit',
//               amount: hdfcAmount,
//             },
//             {
//               account_id: '2176308000000028011',
//               debit_or_credit: 'debit',
//               amount: prepaidExpensesAmount,
//             },
//             {
//               account_id: '2176308000000037093',
//               debit_or_credit: 'credit',
//               amount: debitAmount,
//             },
//           ];

//           const onDemandPayload = {
//             journal_date: formatInTimeZone(
//               demandEntry.created_at * 1000,
//               'Asia/Kolkata',
//               'yyyy-MM-dd'
//             ),
//             reference_number: demandEntry.utr,
//             journal_type: 'both',
//             line_items: onDemandLineItems,
//             notes: `Auto Journal for Razorpay On Demand Settlement on ${formatInTimeZone(demandEntry.created_at * 1000, 'Asia/Kolkata', 'yyyy-MM-dd')} with UTR ${demandEntry.utr}`,
//           };

//           const onDemandRequest = {
//             method: 'post',
//             url: `${zohoApiBase}/journals?organization_id=${organizationId}`,
//             headers: {
//               Authorization: `Zoho-oauthtoken ${zohoAuthToken?.access_token}`,
//               'Content-Type': 'application/json',
//             },
//             data: onDemandPayload,
//           };

//           try {
//             const journalRes = await makeZohoBookApiRequest(onDemandRequest);
//             console.log(
//               'On Demand Journal Created For Razorpay',
//               journalRes.journal.reference_number
//             );
//           } catch (error: any) {
//             if (axios.isAxiosError(error)) {
//               console.error(
//                 'Creating On Demand Journal for Razorpay Failed:',
//                 error.response?.data || 'Unknown error'
//               );
//             } else {
//               console.error(
//                 'Unexpected Error While Creating On Demand Journal for Razorpay:',
//                 error?.message
//               );
//             }
//           }
//         }
//       }
//     }
//   } catch (error: any) {
//     if (axios.isAxiosError(error)) {
//       console.error(
//         'Razorpay settlement fetch failed:',
//         error.response?.data?.error || 'Unknown error'
//       );
//       return;
//     } else {
//       console.error('Unexpected Error while fetching razorpay settlement:', error.message);
//       return;
//     }
//   }
// };
