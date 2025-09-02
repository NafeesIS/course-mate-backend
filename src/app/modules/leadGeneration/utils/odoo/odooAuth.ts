import xmlrpc from 'xmlrpc';
import config from '../../../../config';

// Odoo server URL and database name
const odooUrl = 'https://filesure-india-private-limited.odoo.com/';
const db = 'filesure-india-private-limited';
// Odoo credentials from config
const username = config.odoo_username;
const password = config.odoo_password;

// XML-RPC client for Odoo's 'common' endpoint (authentication, version, etc.)
const common = xmlrpc.createClient({ url: `${odooUrl}/xmlrpc/2/common` });
// XML-RPC client for Odoo's 'object' endpoint (model operations)
const object = xmlrpc.createClient({ url: `${odooUrl}/xmlrpc/2/object` });

// Export Odoo connection and credential objects for use in other modules
export { common, db, object, password, username };

/**
 * Authenticates with the Odoo server and retrieves the user ID (uid).
 *
 * @returns A promise resolving to the authenticated Odoo user ID (uid).
 * @throws If authentication fails or no UID is returned.
 */
export async function authenticateOdoo(): Promise<number> {
  return new Promise((resolve, reject) => {
    common.methodCall(
      'authenticate',
      [db, username, password, {}],
      (err: unknown, uid: unknown) => {
        if (err) {
          // Reject with a descriptive error message if authentication fails
          const errorMsg = err instanceof Error ? err.message : String(err);
          reject(new Error(`[Odoo] Authentication failed: ${errorMsg}`));
        } else if (typeof uid !== 'number') {
          // Reject if UID is not returned as a number
          reject(new Error('[Odoo] Authentication failed: No UID returned.'));
        } else {
          // Resolve with the authenticated user ID
          resolve(uid);
        }
      }
    );
  });
}
