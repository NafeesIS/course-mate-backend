import { odooExecuteKw } from './odooXmlRpcClient';

// In-memory cache for UTM records by model and name to minimize Odoo API calls
const utmCache: Record<string, Record<string, number>> = {
  'utm.campaign': {},
  'utm.medium': {},
  'utm.source': {},
};

/**
 * Retrieves the ID of a UTM record (campaign, medium, or source) by name, or creates it if it doesn't exist.
 * Utilizes in-memory caching to avoid redundant Odoo API calls.
 *
 * @param model - The UTM model to search/create ('utm.campaign', 'utm.medium', or 'utm.source').
 * @param name - The name of the UTM record to find or create.
 * @param uid - Odoo user ID for authentication.
 * @returns The Odoo ID of the UTM record, or undefined if name is not provided.
 * @throws If the Odoo API call fails.
 */
export async function getOrCreateUtmRecord(
  model: 'utm.campaign' | 'utm.medium' | 'utm.source',
  name: string | undefined,
  uid: number
): Promise<number | undefined> {
  if (!name) return undefined;
  // Return cached ID if available
  if (utmCache[model][name]) return utmCache[model][name];
  try {
    // Search for the UTM record by name
    const ids: number[] = await odooExecuteKw(uid, model, 'search', [[['name', '=', name]]], {
      limit: 1,
    });
    if (ids.length) {
      utmCache[model][name] = ids[0];
      return ids[0];
    }
    // If not found, create the UTM record
    const id: number = await odooExecuteKw(uid, model, 'create', [{ name }]);
    utmCache[model][name] = id;
    return id;
  } catch (err) {
    throw new Error(`[Odoo] Failed to get or create UTM record for ${model} ${name}: ${err}`);
  }
}

/**
 * Extracts UTM parameters and fbclid from a URL pathname string.
 *
 * @param pathname - The URL pathname (may include query string) to extract UTM params from.
 * @returns An object containing UTM parameters and fbclid, or empty if extraction fails.
 */
export function extractUtmParams(pathname?: string): Record<string, string | undefined> {
  if (!pathname) return {};
  try {
    // Remove leading '@' if present (for special cases)
    const urlStr = pathname.startsWith('@') ? pathname.slice(1) : pathname;
    const url = new URL(urlStr);
    const params = url.searchParams;
    return {
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      utm_content: params.get('utm_content') || undefined,
      utm_term: params.get('utm_term') || undefined,
      utm_id: params.get('utm_id') || undefined,
      fbclid: params.get('fbclid') || undefined,
    };
  } catch {
    // Return empty object if URL parsing fails
    return {};
  }
}
