// Import multer library for handling multipart/form-data (file uploads)
const multer = require('multer')

// Configure multer middleware with memory storage and file size limits
const upload = multer({
  // Use memory storage to store files as Buffer objects
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB file size limit (15 * 1024 * 1024 bytes)
  }
});

// Export configured multer middleware
module.exports = upload