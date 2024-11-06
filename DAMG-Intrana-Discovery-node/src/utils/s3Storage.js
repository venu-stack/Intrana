// Import required AWS SDK and configuration
const AWS = require('aws-sdk');
const config = require('../config/config');

// Suppress AWS SDK's maintenance mode warning messages
require('aws-sdk/lib/maintenance_mode_message').suppress = true;

// Configure AWS SDK with credentials from config file
// This includes access key, secret key and region for S3 access
AWS.config.update({
  accessKeyId: config.s3.accessKey,
  secretAccessKey: config.s3.accessSecret,
  region: config.s3.region
});

// Initialize new S3 service object
// This object will be used for all S3 operations (upload, download, delete etc)
const s3 = new AWS.S3();

// Export the configured S3 instance for use in other modules
// Other files can import this to interact with S3 bucket
module.exports = s3;