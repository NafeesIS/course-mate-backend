import { authenticateOdoo } from './odooAuth';
import { createOrUpdateOdooContact } from './odooContactManager';
import { mapCountryStateToIds } from './odooCountryStateMapper';
import { odooExecuteKw } from './odooXmlRpcClient';

/**
 * Interface for the payload required to create an Odoo Opportunity (crm.lead).
 * Includes user and order details, address, and expected revenue.
 */
export interface OdooOpportunityParams {
  name: string; // Opportunity name (e.g., user + plan + orderId)
  userName: string; // Full user name (for contact creation)
  email_from?: string; // User email
  phone?: string; // User phone
  street?: string; // Billing street address
  city?: string; // Billing city
  country?: string; // Billing country
  state?: string; // Billing state
  description?: string; // Opportunity description
  expected_revenue?: number; // Calculated expected revenue for the opportunity
}

/**
 * Checks for duplicate Odoo opportunities by email or phone.
 * Returns true if a matching crm.lead already exists.
 */
async function checkDuplicateOpportunity(
  uid: number,
  email?: string,
  phone?: string
): Promise<boolean> {
  if (!email && !phone) return false;
  let domain: unknown;
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
    // Search for existing leads with matching email or phone
    const ids: number[] = await odooExecuteKw(uid, 'crm.lead', 'search', [domain], { limit: 1 });
    return ids.length > 0;
  } catch (err) {
    throw new Error(`[Odoo] Failed to check duplicate opportunity: ${err}`);
  }
}

/**
 * Creates an Odoo Opportunity (crm.lead) for a subscription order.
 * - Checks for duplicates by email/phone
 * - Maps country/state to Odoo IDs
 * - Ensures a partner/contact exists and links it
 * - Sets expected revenue and address fields
 * @param params OdooOpportunityParams
 * @returns The created opportunity's Odoo ID
 */
export async function createOdooOpportunity(params: OdooOpportunityParams): Promise<number> {
  const {
    name,
    userName,
    email_from,
    phone,
    street,
    city,
    country,
    state,
    description,
    expected_revenue,
  } = params;

  // Authenticate with Odoo and get user ID
  const uid = await authenticateOdoo();

  // Prevent duplicate opportunities for the same user (by email/phone)
  if (await checkDuplicateOpportunity(uid, email_from, phone)) {
    throw new Error(
      `[Odoo] Duplicate opportunity detected for this email or phone ${email_from} ${phone}. Skipping...`
    );
  }

  // Prepare the base opportunity data
  const opportunityData: Record<string, unknown> = {
    name,
    email_from,
    phone,
    description,
    type: 'opportunity',
  };

  // Set expected revenue if provided
  if (typeof expected_revenue === 'number') opportunityData.expected_revenue = expected_revenue;
  // Set address fields if provided
  if (street) opportunityData.street = street;
  if (city) opportunityData.city = city;

  // Map country/state to Odoo IDs if both are provided
  if (country && state) {
    const { country_id, state_id } = await mapCountryStateToIds(uid, country, state);
    if (country_id) opportunityData.country_id = country_id;
    if (state_id) opportunityData.state_id = state_id;
  }

  // Split userName into first and last name for contact creation
  let firstName = userName;
  let lastName = '';
  if (userName && userName.includes(' ')) {
    const parts = userName.split(' ');
    firstName = parts[0];
    lastName = parts.slice(1).join(' ');
  }

  // Ensure a partner/contact exists in Odoo and get its ID
  const partner_id: number | undefined = await createOrUpdateOdooContact(uid, {
    firstName,
    lastName,
    email: email_from,
    phone,
    address: {
      street,
      city,
      state,
      country,
    },
  });
  opportunityData.partner_id = partner_id;

  // Create the opportunity in Odoo
  try {
    const opportunityId: number = await odooExecuteKw(uid, 'crm.lead', 'create', [opportunityData]);
    if (!opportunityId) {
      throw new Error(
        `[Odoo] Failed to create opportunity: No ID returned. Opportunity data: ${JSON.stringify(
          opportunityData
        )}`
      );
    }
    return opportunityId;
  } catch (err) {
    throw new Error(
      `[Odoo] Failed to create opportunity: ${err}. Opportunity data: ${JSON.stringify(
        opportunityData
      )}`
    );
  }
}
