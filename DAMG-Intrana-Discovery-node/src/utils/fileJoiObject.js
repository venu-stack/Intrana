// Import Joi validation library
const Joi = require('joi');

// Define validation schema for file upload object
const fileObject = {
    // Field name of the form field that contains the file
    fieldname: Joi.string().required(),

    // Original name of the uploaded file
    originalname: Joi.string().required(),

    // Encoding type of the file
    encoding: Joi.string().required(),

    // MIME type of the file (e.g. image/jpeg, application/pdf)
    mimetype: Joi.string().required(),

    // Size of the file in bytes
    size: Joi.number().required(),

    // Raw buffer containing the file data
    buffer: Joi.binary().required()
}

// Export the validation schema
module.exports = fileObject