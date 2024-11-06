/**
 * Custom API Error class that extends the built-in Error class
 * Used for handling API-specific errors with additional properties
 */
class ApiError extends Error {
  /**
   * Create a new ApiError instance
   * @param {number} statusCode - HTTP status code for the error
   * @param {string} message - Error message
   * @param {boolean} isOperational - Indicates if error is operational (default: true)
   * @param {string} stack - Error stack trace (optional)
   */
  constructor(statusCode, message, isOperational = true, stack = '') {
    // Call parent Error constructor with message
    super(message);

    // Set custom properties
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Handle stack trace
    if (stack) {
      // Use provided stack trace if available
      this.stack = stack;
    } else {
      // Capture stack trace, excluding constructor call from trace
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;
