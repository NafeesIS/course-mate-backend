/**
 * Extends the native Error class to include a statusCode property,
 * allowing for more detailed error handling and response generation
 * in web applications. This class can be used to standardize error
 * responses across API or application by including both the
 * HTTP status code and a descriptive message. Optionally, a custom
 * stack trace can be provided; otherwise, it captures the stack trace
 * at the point of instantiation.
 *
 * Usage:
 * - Throw an AppError within application or API routes to signal
 *   an error condition along with an appropriate HTTP status code.
 * - Catch the AppError in your error handling middleware to format
 *   and send a structured error response to the client.
 * - Can be used in any place where error handling is needed, such as
 *   database operations, authentication failures, or data validation
 *   processes to provide consistent error feedback.
 *
 * Example:
 * ```
 * // Throwing an AppError
 * if (!user) {
 *   throw new AppError(httpStatus.NOT_FOUND, 'User not found');
 * }
 * ```
 */

class AppError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string, stack = '') {
    super(message);
    this.statusCode = statusCode;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;
