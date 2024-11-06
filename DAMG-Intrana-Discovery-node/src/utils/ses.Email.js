
// Import AWS SDK for interacting with AWS services
const AWS = require('aws-sdk');

// Import configuration settings from config file
const config = require('../config/config');

// Suppress AWS SDK maintenance mode warning messages
require('aws-sdk/lib/maintenance_mode_message').suppress = true;

// Set up S3 credentials
const sesConfig = {
  accessKeyId: config.smtp.SMTP_ACCESS_KEY,
  secretAccessKey: config.smtp.SMTP_SECRET_ACCESS_KEY,
  region: config.s3.region
}

// Create a new instance of the S3 class
const AWS_SES = new AWS.SES(sesConfig);

// Export the S3 instance
module.exports = AWS_SES;