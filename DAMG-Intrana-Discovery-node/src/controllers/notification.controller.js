// Import required modules and utility functions
const httpStatus = require('http-status'); // HTTP status codes utility
const catchAsync = require('../utils/catchAsync'); // Async error handling utility

// Import notification service function
const { getNotificationRoute } = require('../services/notification.service');

// Controller to fetch notification routes/data
// Wrapped in catchAsync to handle any errors during execution
const getNotificationRouteFn = catchAsync(async (req, res) => {
    await getNotificationRoute(req, res) // Calls the notification service to get notification data
});

// Export the notification controller function
module.exports = {
    getNotificationRouteFn
};
