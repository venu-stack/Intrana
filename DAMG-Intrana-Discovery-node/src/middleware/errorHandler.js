// Import required dependencies
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');

/**
 * Converts error to ApiError if needed
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorConverter = (err, req, res, next) => {
  let error = err;
  // If error is not an instance of ApiError, convert it
  if (!(error instanceof ApiError)) {
    // Determine appropriate status code based on error type
    const statusCode =
      error.statusCode || error instanceof mongoose.Error
        ? httpStatus.BAD_REQUEST // Use 400 for mongoose validation errors
        : httpStatus.INTERNAL_SERVER_ERROR; // Use 500 for other errors
    const message = error.message || httpStatus[statusCode];
    // Create new ApiError instance
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

/**
 * Global error handler
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  // If in production and error is not operational, hide error details
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  // Store error message in response locals
  res.locals.errorMessage = err.message;

  // Prepare error response
  const response = {
    code: statusCode,
    message,
    // Include stack trace only in development environment
    ...(config.env === 'development' && { stack: err.stack }),
  };

  // Log error in development environment
  if (config.env === 'development') {
    logger.error(err);
  }

  // Send error response
  res.status(statusCode).send(response);
};

// Export middleware functions
module.exports = {
  errorConverter,
  errorHandler,
};
