// Import required configuration and dependencies
const config = require("../config/config");
const util = require('util');
const DeleteImageFromS3 = require("./DeleteImageFromS3");
const s3 = require("./s3Storage");

// Convert s3.copyObject to use promises instead of callbacks
const copyObject = util.promisify(s3.copyObject).bind(s3);

/**
 * Moves an object from one location to another within an S3 bucket
 * @param {string} sourceKey - The source path/key of the object to move
 * @param {string} destinationKey - The destination path/key where object will be moved
 * @returns {Promise<Object>} Result of the copy operation
 */
module.exports = async function moveObjectS3(sourceKey, destinationKey) {
  try {
    // Get bucket name from config
    const bucketName = config.s3.bucket;

    // Copy the object from source to destination location
    const result = await copyObject({
      Bucket: bucketName,
      CopySource: sourceKey,
      Key: destinationKey,
    })

    // Delete the original object from source location
    DeleteImageFromS3(sourceKey)

    // Return the result of copy operation
    return result

    // Below is the original callback implementation (commented out)
    // Keeping for reference of how it was done before promises
    // s3.copyObject(
    //   {
    //     Bucket: bucketName,
    //     CopySource: sourceKey,
    //     Key: destinationKey,
    //   },
    //   (copyErr, copyData) => {
    //     if (copyErr) {
    //       console.error('Error copying object:', copyErr);
    //     } else {
    //       console.log('Object moved successfully');

    //       // After successfully copying, delete the source object
    //       s3.deleteObject(
    //         {
    //           Bucket: bucketName,
    //           Key: sourceKey,
    //         },
    //         (deleteErr, deleteData) => {
    //           if (deleteErr) {
    //             console.error('Error deleting source object:', deleteErr);
    //           } else {
    //             console.log('Source object deleted successfully');
    //           }
    //         }
    //       );
    //     }
    //   }
    // );
  } catch (error) {
    // Re-throw any errors that occur during the process
    throw error
  }
};