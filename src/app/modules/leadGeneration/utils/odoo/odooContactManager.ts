import { mapCountryStateToIds } from './odooCountryStateMapper';
import { odooExecuteKw } from './odooXmlRpcClient';

/**
 * Finds an Odoo contact by email or phone number.
 *
 * @param uid - Odoo user ID for authentication.
 * @param email - (Optional) Email address to search for.
 * @param phone - (Optional) Phone number to search for.
 * @returns The contact's Odoo ID if found, otherwise null.
 */
export async function findOdooContactByEmailOrPhone(
  uid: number,
  email?: string,
  phone?: string
): Promise<number | null> {
  // If neither email nor phone is provided, return null
  if (!email && !phone) return null;
  let domain: unknown;
  // Build the Odoo search domain based on provided parameters
  if (email && phone) {
    // Search for either email or phone
    domain = ['|', ['email', '=', email], ['phone', '=', phone]];
  } else if (email) {
    domain = [['email', '=', email]];
  } else if (phone) {
    domain = [['phone', '=', phone]];
  } else {
    domain = [];
  }
  try {
    // Search for the contact in Odoo and return the first match (if any)
    const ids: number[] = await odooExecuteKw(uid, 'res.partner', 'search', [domain], { limit: 1 });
    return ids.length ? ids[0] : null;
  } catch (err) {
    throw new Error(`[Odoo] Failed to find contact by email/phone: ${err}`);
  }
}

/**
 * Creates a new Odoo contact or updates an existing one based on email or phone.
 *
 * @param uid - Odoo user ID for authentication.
 * @param person - Object containing contact details (name, email, phone, address).
 * @returns The Odoo contact ID (either newly created or updated).
 */
export async function createOrUpdateOdooContact(
  uid: number,
  person: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      zipCode?: string;
      state?: string;
      country?: string;
    };
  }
): Promise<number> {
  let country_id, state_id;
  // If address contains country or state, map them to Odoo IDs
  if (person.address?.country || person.address?.state) {
    const ids = await mapCountryStateToIds(uid, person.address?.country, person.address?.state);
    country_id = ids.country_id;
    state_id = ids.state_id;
  }

  // Prepare the contact data for Odoo
  const contactData: Record<string, unknown> = {
    name: `${person.firstName} ${person.lastName}`.trim(),
    email: person.email,
    phone: person.phone,
    street: person.address?.street,
    city: person.address?.city,
    zip: person.address?.zipCode,
    country_id,
    state_id,
    is_company: false,
  };

  // Check if a contact already exists with the given email or phone
  const existingId = await findOdooContactByEmailOrPhone(uid, person.email, person.phone);

  if (existingId) {
    // Update the existing contact
    try {
      await odooExecuteKw(uid, 'res.partner', 'write', [[existingId], contactData]);
      console.log(`[Odoo] Updated contact ${existingId}`);
      return existingId;
    } catch (err) {
      throw new Error(`[Odoo] Failed to update contact ${existingId}: ${err}`);
    }
  } else {
    // Create a new contact
    try {
      const partnerId: number = await odooExecuteKw(uid, 'res.partner', 'create', [contactData]);
      console.log(`[Odoo] Created contact ${partnerId}`);
      return partnerId;
    } catch (err) {
      throw new Error(`[Odoo] Failed to create contact: ${err}`);
    }
  }
}
