/**
 * Higher-order function that wraps an async route handler to handle Promise rejections
 * @param {Function} fn - The async route handler function to wrap
 * @returns {Function} Wrapped function that catches any errors and passes them to Express error handler
 */
const catchAsync = (fn) => (req, res, next) => {
  // Wrap the function execution in Promise.resolve() to handle both async and sync functions
  // If an error occurs, pass it to Express error handling middleware via next()
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

module.exports = catchAsync;