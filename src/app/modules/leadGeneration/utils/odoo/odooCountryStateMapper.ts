import { odooExecuteKw } from './odooXmlRpcClient';

// In-memory cache for country name to Odoo country_id mapping
const countryCache: Record<string, number> = {};
// In-memory cache for state name to Odoo state_id mapping, nested by country
const stateCache: Record<string, Record<string, number>> = {};

/**
 * Maps country and state names to their corresponding Odoo IDs.
 * Utilizes in-memory caching to minimize redundant Odoo API calls.
 *
 * @param uid - Odoo user ID for authentication.
 * @param countryName - (Optional) Name of the country to map.
 * @param stateName - (Optional) Name of the state to map.
 * @returns An object containing country_id and state_id (or null if not found).
 */
export async function mapCountryStateToIds(
  uid: number,
  countryName?: string,
  stateName?: string
): Promise<{ country_id: number | null; state_id: number | null }> {
  let country_id: number | null = null;
  let state_id: number | null = null;

  // Lookup or fetch country_id
  if (countryName) {
    if (countryCache[countryName]) {
      // Use cached country_id if available
      country_id = countryCache[countryName];
    } else {
      try {
        // Search for country by name in Odoo
        const countryIds: number[] = await odooExecuteKw(
          uid,
          'res.country',
          'search',
          [[['name', '=', countryName]]],
          { limit: 1 }
        );
        country_id = countryIds.length ? countryIds[0] : null;
        // Cache the result for future lookups
        if (country_id) countryCache[countryName] = country_id;
      } catch (err) {
        throw new Error(`[Odoo] Failed to fetch country_id for ${countryName}: ${err}`);
      }
    }
  }

  // Lookup or fetch state_id (requires country_id and countryName)
  if (stateName && country_id && countryName) {
    if (stateCache[countryName]?.[stateName]) {
      // Use cached state_id if available
      state_id = stateCache[countryName][stateName];
    } else {
      try {
        // Search for state by name and country_id in Odoo
        const stateIds: number[] = await odooExecuteKw(
          uid,
          'res.country.state',
          'search',
          [
            [
              ['name', '=', stateName],
              ['country_id', '=', country_id],
            ],
          ],
          { limit: 1 }
        );
        state_id = stateIds.length ? stateIds[0] : null;
        // Cache the result for future lookups
        if (state_id) {
          if (!stateCache[countryName]) stateCache[countryName] = {};
          stateCache[countryName][stateName] = state_id;
        }
      } catch (err) {
        throw new Error(
          `[Odoo] Failed to fetch state_id for ${stateName}, country ${countryName}: ${err}`
        );
      }
    }
  }

  // Return the mapped IDs (or null if not found)
  return { country_id, state_id };
}
