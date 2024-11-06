// Import required dependencies
const config = require('../config/config');
const s3 = require('./s3Storage')
const bucketName = config.s3.bucket
const path = require('path');

/**
 * Creates directories recursively in an S3 bucket
 * @param {string} directoryPath - Path of directory to create
 * @returns {string} The created directory path
 */
module.exports = async function createDirectoryRecursive(directoryPath) {
    // Split the directory path into parts using backslash as separator
    const parts = directoryPath.split('\\');
    let currentPath = '';

    // Iterate through each part of the path
    for (let i = 0; i < parts.length; i++) {
        // Build the current path by joining parts using forward slash
        currentPath = path.posix.join(currentPath, parts[i]);
     
        try {
            // Check if directory already exists in S3
            await s3.headObject({
                Bucket: bucketName,
                Key: `${currentPath}/`,
            }).promise();
        } catch (error) {
            if (error.code === 'NotFound') {
                // Directory doesn't exist, create it in S3
                await s3.putObject({
                    Bucket: bucketName,
                    Key: `${currentPath}/`,
                    Body: null,
                    ACL: 'public-read',
                    ContentType: 'application/x-directory',
                }).promise();
                console.log(`Directory created successfully: s3://${bucketName}/${currentPath}`);
            } else {
                // Log and rethrow any other errors
                console.error(`Error checking directory: ${currentPath}`, error);
                throw error;
            }
        }
    }
    // Return the final created directory path
    return currentPath
}