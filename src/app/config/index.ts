/* eslint-disable camelcase */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  NODE_ENV: process.env.NODE_ENV,
  FSEnvironment: process.env.FSEnvironment,
  port: process.env.PORT,
  // eslint-disable-next-line camelcase
  database_url: process.env.DATABASE_URL,
  aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
  aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
  region_name: process.env.REGION_NAME,
  srn_queue_url: process.env.SRN_QUEUE_URL,
  // company_update_queue_url: process.env.COMPANY_UPDATE_QUEUE_URL,
  company_update_queue_name: process.env.COMPANY_UPDATE_QUEUE_NAME,
  gst_update_queue_url: process.env.GST_UPDATE_QUEUE_URL,
  llp_vpd_update_queue_url: process.env.LLP_VPD_UPDATE_QUEUE_URL,
  director_mobile_updater_queue_url: process.env.DIRECTOR_MOBILE_UPDATER_QUEUE,
  // director_updater_queue_url: process.env.DIRECTOR_UPDATER_QUEUE,
  director_updater_queue_name: process.env.DIRECTOR_UPDATER_QUEUE_NAME,
  company_vpd_v3_update_queue_name: process.env.COMPANY_VPD_V3_UPDATE_QUEUE_NAME,
  google_application_credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  razorpay_test_key_id: process.env.RAZROR_PAY_TEST_KEY_ID,
  razorpay_test_key_secret: process.env.RAZOR_PAY_TEST_KEY_SECRET,
  razorpay_key_id: process.env.RAZOR_PAY_KEY_ID,
  razorpay_key_secret: process.env.RAZOR_PAY_KEY_SECRET,
  cashFree_test_ID: process.env.CASHFREE_TEST_XCLIENTID,
  cashFree_test_secretKey: process.env.CASHFREE_TEST_XSECRETKEY,
  cashFree_live_ID: process.env.CASHFREE_XCLIENTID,
  cashFree_live_secretKey: process.env.CASHFREE_XSECRETKEY,
  supertoken_connection_URI: process.env.SUPERTOKEN_CONNECTION_URI,
  supertoken_api_key: process.env.SUPERTOKEN_API_KEY,
  azure_service_bus_connection_string: process.env.AZURE_SERVICE_BUS_CONNECTION_STRING,
  odoo_username: process.env.ODOO_USERNAME,
  odoo_password: process.env.ODOO_PASSWORD,
  mailchimp_api_key: process.env.MAILCHIMP_API_KEY,
  azure_filesure_storage_token: process.env.AZURE_FILESURE_STORAGE_TOKEN,
  recaptcha_secret_key: process.env.RECAPTCHA_SECRET_KEY,
};
