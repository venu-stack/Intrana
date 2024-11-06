// Import configuration settings
const config = require("../config/config")

/**
 * Generates parameters object for S3 upload operations
 * @param {string} filePath - The full path/key where file will be stored in S3
 * @param {Object} file - File object containing buffer and metadata
 * @returns {Object} Parameters object for S3 upload
 */
const getS3Params = (filePath, file) => {
  return {
    // Name of the S3 bucket from config
    Bucket: config.s3.bucket,
    
    // Full path/key where the file will be stored
    Key: `${filePath}`,
    
    // Convert file buffer to binary format for upload
    Body: Buffer.from(file.buffer, 'binary'),
    
    // Set public read access for the uploaded file
    ACL: "public-read",
    
    // Set content type based on file's mimetype
    ContentType: file.mimetype
  }
}

// Export the function
module.exports = getS3Params