import mailchimp from '@mailchimp/mailchimp_marketing';
import * as crypto from 'crypto';
import config from '../../config';
import { MAILCHIMP_LIST_ID, MAILCHIMP_REGION } from './mailchimp.constant';
import { MailchimpUserData, mailchimpUserZodSchema } from './mailchimp.interface';

/**
 * Configure Mailchimp client once at module load.
 * Uses API key from environment config.
 */
mailchimp.setConfig({
  apiKey: config.mailchimp_api_key,
  server: MAILCHIMP_REGION,
});

/**
 * Ping Mailchimp API to verify connectivity.
 * @returns {Promise<any>} Mailchimp ping response
 */
const ping = async () => {
  return await mailchimp.ping.get();
};

/**
 * Generate Mailchimp subscriber hash from email (MD5, lowercase).
 * @param {string} email
 * @returns {string} Subscriber hash
 */
const getSubscriberHash = (email: string): string =>
  crypto.createHash('md5').update(email.toLowerCase()).digest('hex');

/**
 * Extracts a human-readable error message from Mailchimp API errors.
 * @param {unknown} error
 * @returns {string} Error message
 */
function extractMailchimpError(error: unknown): string {
  if (
    typeof error === 'object' &&
    error &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'body' in error.response &&
    error.response.body &&
    typeof error.response.body === 'object' &&
    'detail' in error.response.body
  ) {
    return (error.response.body as { detail?: string }).detail || 'Unknown error';
  } else if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

/**
 * Adds or updates a user in the Mailchimp audience and applies tags.
 * - Subscribes new users, updates existing ones.
 * - Applies tags if provided.
 * - Throws with detailed error if Mailchimp API fails.
 *
 * @param {MailchimpUserData} userData - User data to add/update
 */
const addOrUpdateUserToAudience = async (userData: MailchimpUserData): Promise<void> => {
  // Validate incoming data using Zod schema
  const validatedData = mailchimpUserZodSchema.parse(userData);

  const { email, firstName = '', lastName = '', phoneNumber = '', tags = [] } = validatedData;
  const subscriberHash = getSubscriberHash(email);

  // Prepare merge fields
  const mergeFields: { FNAME?: string; LNAME?: string; PHONE?: string } = {
    FNAME: firstName,
    LNAME: lastName,
  };
  if (phoneNumber) {
    mergeFields.PHONE = phoneNumber;
  }

  // Upsert user in Mailchimp list
  try {
    await mailchimp.lists.setListMember(MAILCHIMP_LIST_ID, subscriberHash, {
      email_address: email,
      status_if_new: 'subscribed',
      merge_fields: mergeFields,
    });
    console.log(`[Mailchimp] User ${email} added to Mailchimp`);
  } catch (error) {
    throw new Error(`Mailchimp error: ${extractMailchimpError(error)}`);
  }

  // Apply tags if provided
  if (Array.isArray(tags) && tags.length > 0) {
    const tagObjects = tags.map(tag => ({ name: tag, status: 'active' }));
    try {
      await mailchimp.lists.updateListMemberTags(MAILCHIMP_LIST_ID, subscriberHash, {
        tags: tagObjects,
      });
      console.log(`[Mailchimp] Tags applied to user ${email}`);
    } catch (error) {
      throw new Error(`Mailchimp tag error: ${extractMailchimpError(error)}`);
    }
  }
};

export const MailchimpServices = {
  ping,
  addOrUpdateUserToAudience,
};
