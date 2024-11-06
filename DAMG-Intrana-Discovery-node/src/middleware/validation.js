// Import required dependencies
const Joi = require('joi'); // For schema validation
const httpStatus = require('http-status'); // For HTTP status codes
const pick = require('../utils/pick'); // Utility to pick specific properties from objects
const ApiError = require('../utils/ApiError'); // Custom API error handler

/**
 * Middleware factory function that creates a validation middleware
 * @param {Object} schema - Joi validation schema object
 * @param {Array} dataTypeArray - Array of data types to validate (e.g. ['body', 'query', 'params'])
 * @returns {Function} Express middleware function
 */
const validate = (schema, dataTypeArray) => (req, res, next) => {
  debugger
  // Pick only the schema properties we want to validate
  const validSchema = pick(schema, dataTypeArray);
  // Extract corresponding properties from request object
  const object = pick(req, Object.keys(validSchema));

  // If request body exists and is a string, try to parse it as JSON
  if (object.body && typeof object.body === 'string') {
    try {
      object.body = JSON.parse(object.body);
    } catch (error) {
      return next(new ApiError(httpStatus.BAD_REQUEST, 'invalid_body'));
    }
  }

  // Compile and validate the schema against the request data
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  // If validation fails, return error with all validation messages
  if (error) {
    const errorMessage = error.details
      .map((details) => details.message)
      .join(', ');
    return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
  }

  // Validation passed - assign validated values back to request object
  Object.assign(req, value);
  return next();
};

// Export the validation middleware factory
module.exports = validate;
