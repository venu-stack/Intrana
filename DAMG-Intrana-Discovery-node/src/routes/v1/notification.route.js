// Import required dependencies
const express = require('express');
const { notificationController } = require('../../controllers');
const readClaims = require('../../middleware/claims');

// Create Express router instance
const router = express.Router();

// Route to get notification count for authenticated user
// Uses readClaims middleware to verify authentication
// Calls getNotificationRouteFn controller method
router.get('/getNotificationCount',[readClaims], notificationController.getNotificationRouteFn);

// Export router for use in main application
module.exports = router;