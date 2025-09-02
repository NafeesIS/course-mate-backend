import { db, object, password } from './odooAuth';

/**
 * Executes an Odoo XML-RPC 'execute_kw' method call.
 *
 * @template T - The expected return type of the Odoo call.
 * @param uid - Odoo user ID for authentication.
 * @param model - The Odoo model to operate on (e.g., 'res.partner').
 * @param method - The method to call on the model (e.g., 'search', 'create', 'write').
 * @param args - Positional arguments for the method.
 * @param kwargs - (Optional) Keyword arguments for the method.
 * @returns A promise resolving to the result of the Odoo call, typed as T.
 */
export async function odooExecuteKw<T = unknown>(
  uid: number,
  model: string,
  method: string,
  args: unknown[],
  kwargs?: Record<string, unknown>
): Promise<T> {
  return new Promise((resolve, reject) => {
    // Prepare parameters for the XML-RPC call
    const params: unknown[] = [db, uid, password, model, method, args];
    // If keyword arguments are provided, append them
    if (kwargs && Object.keys(kwargs).length > 0) {
      params.push(kwargs);
    }
    // Make the XML-RPC call to Odoo
    object.methodCall('execute_kw', params, (err: unknown, result: unknown) => {
      if (err) {
        // Format and reject with a descriptive error message
        const errorMsg = err instanceof Error ? err.message : String(err);
        reject(new Error(`[Odoo] execute_kw failed for ${model}.${method}: ${errorMsg}`));
      } else {
        // Resolve with the result, cast to the expected type
        resolve(result as T);
      }
    });
  });
}
