// Import required configuration and S3 client
const config = require("../config/config");
const s3 = require("./s3Storage");

/**
 * Deletes an image from S3 bucket
 * @param {string} imageName - Name/key of the image to delete from S3
 * @returns {Promise<void>} 
 */
module.exports = async function deleteImageFromS3(imageName) {
  try {
    // Specify the parameters for the delete operation
    // Bucket - The S3 bucket name from config
    // Key - The full path/name of image to delete
    const params = {
      Bucket: config.s3.bucket,
      Key: imageName
    };

    // Call S3 deleteObject API to remove the image
    // Takes params object and callback function
    s3.deleteObject(params, (err, data) => {
      // Log success message with response data
      console.log('Image deleted successfully', data);
    });

  } catch (error) {
    // Log any errors that occur during deletion
    console.error('Error deleting image:', error);
  }
}