// Import required dependencies
const path = require('path')
const createDirectoryRecursive = require('./createDirectoryRecursive');

/**
 * Generates a file path for uploads and validates file properties if provided
 * @param {string} name - Name to create directory from
 * @param {string} folderName - Primary folder name
 * @param {string} folderName1 - Optional secondary folder name
 * @param {Object} file - Optional file object containing file details
 * @returns {Object} Status and generated file path
 */
const getFilePath = async (name, folderName, folderName1, file) => {
   let finalDirPath
   if (name) {
      // Sanitize name by replacing special chars with underscore and cleaning up multiple/leading/trailing underscores
      const dirForName = name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_{2,}/g, '_').replace(/^_|_$/g, '');
      if (!folderName1) {
         // Create path with primary folder only
         finalDirPath = path.posix.join('uploads', folderName, `${dirForName}`);
      } else {
         // Create path with both primary and secondary folders
         finalDirPath = path.posix.join('uploads', folderName, `${dirForName}`, folderName1);
      }
   } else {
      // Default path for temporary images
      finalDirPath = path.posix.join('uploads', 'tempImages');
   }

   let filePath
   // Create directory structure recursively in S3
   const finalPath = await createDirectoryRecursive(finalDirPath)

   if (file) {
      // Define allowed file types
      const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/gif', 'video/mp4'];
      // Validate file type
      if (!allowedMimeTypes.includes(file.mimetype)) {
         return { status: false, message: 'invalid file type' }
      }
      // Define and validate max file size (15MB)
      const fileSize = 15000000
      if (file.size > 15000000) return { status: false, message: `file size to large please select max size is ${fileSize} mb` }
      // Append filename to directory path
      filePath = finalPath + '/' + file.originalname;
   } else {
      // Return just the directory path if no file provided
      filePath = finalPath
   }

   return { status: true, filePath: filePath }
}

module.exports = getFilePath
