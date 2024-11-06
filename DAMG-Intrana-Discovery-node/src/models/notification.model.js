// Import mongoose ODM library for MongoDB
const mongoose = require('mongoose');

// Define notification schema with mongoose
const notificationSchema = new mongoose.Schema({
  // Type of notification
  isType: {
    type: Number,       // 1 for nftbidplace, can be extended for other notification types
    required: true,     // Must be provided
  },
  // Content of the notification
  message: {
    type: String,       // Text content
    required: true,     // Must be provided
  },
  // User who will receive the notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,  // MongoDB ObjectId type
    ref: 'User',                          // References the User model
    required: true,                       // Must be provided
  },
  // Flag indicating if notification has been read
  isRead: {
    type: Boolean,      // True/False value
    default: false,     // Initially set to unread
  },
  // When the notification was created
  timestamp: {
    type: Date,         // Date/time value
    default: Date.now,  // Automatically set to current time
  },
});

// Create mongoose model from schema
const Notification = mongoose.model('Notification', notificationSchema);

// Export the notification model for use in other files
module.exports = Notification;
