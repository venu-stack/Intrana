// Importing necessary modules and middlewares for enhanced security, parsing, and handling requests
const express = require('express'); // Express framework for building the server and handling routes
const helmet = require('helmet'); // Helmet for setting security-related HTTP headers
const xss = require('xss-clean'); // Middleware to prevent cross-site scripting attacks
const mongoSanitize = require('express-mongo-sanitize'); // Middleware to sanitize MongoDB queries
const compression = require('compression'); // Middleware to compress responses for better performance
const cors = require('cors'); // CORS middleware to allow cross-origin requests
const httpStatus = require('http-status'); // HTTP status codes utility for readability

// Custom error handling middleware and utilities
const { errorConverter, errorHandler } = require('./src/middleware/errorHandler'); // Middleware for error conversion and handling
const ApiError = require('./src/utils/ApiError'); // Custom error class for API errors

// Router for API endpoints
const router = require('./src/routes/v1'); // Versioned router for API endpoints

// Import cron jobs and contract logic, likely for scheduled tasks and blockchain interactions
require('./src/cronJob/collection.cron'); // Cron job scheduling for specific tasks
require('./src/contract/index'); // Contract interaction setup, potentially for blockchain or external service interaction

// Initialize Express application
const app = express();

// Set up middlewares for security, data parsing, and performance
app.use(helmet()); // Adds secure headers to HTTP responses
app.use(express.text()); // Parses plain text requests
app.use(express.json()); // Parses JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data
app.use(xss()); // Sanitizes inputs to prevent XSS attacks
app.use(mongoSanitize()); // Sanitizes inputs to prevent MongoDB injection attacks
app.use(compression()); // Compresses HTTP responses for improved performance
app.use(cors()); // Enables CORS for all routes
app.options('*', cors()); // Allows pre-flight across all routes

// Mount API routes under '/api' path
app.use('/api', router);

// Middleware to handle 404 errors for undefined routes
// eslint-disable-next-line prettier/prettier
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found')); // If route is not found, throw a 404 error
});

// Token-gated service route
app.get('/api/token-gated-service', async (req, res, next) => {
  const { address } = req.query; // User's Ethereum address passed as a query parameter
  try {
    const balance = await contract.methods.balanceOf(address).call();
    if (balance > 0) {
      res.send('Access granted to token-gated service');
    } else {
      throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
    }
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use(errorConverter); // Converts errors to ApiError format
app.use(errorHandler); // Handles errors and sends appropriate responses

// Create HTTP server with the Express app
const http = require("http").Server(app); // HTTP server wrapping the Express application

// Export the HTTP server to be used in other modules
module.exports = http;
