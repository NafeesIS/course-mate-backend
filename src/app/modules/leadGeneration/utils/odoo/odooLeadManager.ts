import { authenticateOdoo } from './odooAuth';
import { extractUtmParams, getOrCreateUtmRecord } from './odooUtmHelpers';
import { odooExecuteKw } from './odooXmlRpcClient';

/**
 * Interface representing the parameters required to create an Odoo lead.
 */
export interface OdooLeadParams {
  name: string; // Lead name (usually person's name or company)
  email_from?: string; // (Optional) Lead's email address
  phone?: string; // (Optional) Lead's phone number
  description?: string; // (Optional) Additional description for the lead
  pathname?: string; // (Optional) URL pathname for extracting UTM params
}

/**
 * Checks if a lead with the given email or phone already exists in Odoo.
 *
 * @param uid - Odoo user ID for authentication.
 * @param email - (Optional) Email address to check for duplicates.
 * @param phone - (Optional) Phone number to check for duplicates.
 * @returns True if a duplicate lead exists, false otherwise.
 */
async function checkDuplicateLead(uid: number, email?: string, phone?: string): Promise<boolean> {
  // If neither email nor phone is provided, skip duplicate check
  if (!email && !phone) return false;
  let domain: unknown;
  // Build the Odoo search domain based on provided parameters
  if (email && phone) {
    domain = ['|', ['email_from', '=', email], ['phone', '=', phone]];
  } else if (email) {
    domain = [['email_from', '=', email]];
  } else if (phone) {
    domain = [['phone', '=', phone]];
  } else {
    domain = [];
  }
  try {
    // Search for the lead in Odoo and return true if any found
    const ids: number[] = await odooExecuteKw(uid, 'crm.lead', 'search', [domain], { limit: 1 });
    return ids.length > 0;
  } catch (err) {
    throw new Error(`[Odoo] Failed to check duplicate lead: ${err}`);
  }
}

/**
 * Creates a new lead in Odoo CRM, including UTM tracking if available.
 * Throws an error if a duplicate lead is detected by email or phone.
 *
 * @param params - Object containing lead details (name, email, phone, etc.).
 * @returns The Odoo lead ID of the newly created lead.
 * @throws If a duplicate lead is found or creation fails.
 */
export async function createOdooLead(params: OdooLeadParams): Promise<number> {
  const { name, email_from, phone, description, pathname } = params;

  // Authenticate with Odoo and get user ID
  const uid = await authenticateOdoo();
  // Check for duplicate lead by email or phone
  const isDuplicate = await checkDuplicateLead(uid, email_from, phone);
  if (isDuplicate) {
    throw new Error(
      `[Odoo] Duplicate lead detected for this email or phone ${email_from} ${phone}. Skipping...`
    );
  }

  // Extract UTM parameters from the pathname (if provided)
  const utmData = extractUtmParams(pathname);
  let campaign_id: number | undefined;
  let medium_id: number | undefined;
  let source_id: number | undefined;

  // If any UTM data is present, get or create the corresponding UTM records in Odoo
  if (utmData.utm_campaign || utmData.utm_medium || utmData.utm_source) {
    campaign_id = await getOrCreateUtmRecord('utm.campaign', utmData.utm_campaign, uid);
    medium_id = await getOrCreateUtmRecord('utm.medium', utmData.utm_medium, uid);
    source_id = await getOrCreateUtmRecord('utm.source', utmData.utm_source, uid);
  }

  // Prepare the lead data for Odoo
  const leadData: Record<string, unknown> = {
    name,
    email_from,
    phone,
    description,
    type: 'lead',
    ...(campaign_id ? { campaign_id } : {}),
    ...(medium_id ? { medium_id } : {}),
    ...(source_id ? { source_id } : {}),
    // Add 'referred' field if utm_content or fbclid is present
    ...(utmData.utm_content || utmData.fbclid
      ? { referred: utmData.utm_content || utmData.fbclid }
      : {}),
  };

  try {
    // Create the lead in Odoo and return the new lead ID
    const leadId: number = await odooExecuteKw(uid, 'crm.lead', 'create', [leadData]);
    if (!leadId) {
      throw new Error('[Odoo] Failed to create lead: No ID returned.');
    }
    return leadId;
  } catch (err) {
    throw new Error(`[Odoo] Failed to create lead: ${err}`);
  }
}
