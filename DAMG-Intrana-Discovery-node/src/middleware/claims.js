// Import required dependencies
const jwt = require('jsonwebtoken'); // For JWT token verification
const httpStatus = require('http-status'); // For HTTP status codes
const ApiError = require('../utils/ApiError'); // Custom API error handler
const config = require('../config/config'); // Application configuration

/**
 * Middleware to verify and extract JWT claims from authorization header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object 
 * @param {Function} next - Express next middleware function
 * @returns {Function} next middleware or error response
 */
const readClaims = async (req, res, next) => {
  try {
    // Extract authorization header from request
    const authHeader = req.header('authorization');

    // Check if authorization header exists
    if (!authHeader) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'unauthorized'));
    }

    // Verify JWT token using secret from config
    const tokenData = jwt.verify(authHeader, config.JWT_TOKEN_SECRET);

    // Attach decoded token data to request object
    req.claims = tokenData;

    return next();
  } catch (error) {
    // Return error if token is invalid
    return res.status(httpStatus.UNAUTHORIZED).json({ mesage: 'Invalid Token' })
  }
};

// Export middleware function
module.exports = readClaims;
