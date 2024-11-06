// Import Joi validation library for input validation
const Joi = require('joi');
// Import custom file validation object schema
const fileObject = require('../utils/fileJoiObject');

// Validation schema for adding a new NFT collection
const addCollectionValidation = {
    body: {
        name: Joi.string().required(),              // Collection name is required
        description: Joi.string(),                  // Optional collection description
        collectionImage: Joi.string().required(),   // Image URL/path is required
        fileName: Joi.string().required()           // Original filename is required
    },
}

// Validation schema for artist login
const artistLoginValidation = {
    body: {
        username: Joi.string().required(),          // Username is required
        password: Joi.string().required()           // Password is required
    }
}

// Validation schema for artist registration
registerArtistValidation = {
    body: {
        firstName: Joi.string().required(),         // Artist's first name is required
        surname: Joi.string().required(),           // Artist's surname is required
        email: Joi.string().email().required(),     // Valid email is required
        username: Joi.string().required(),          // Username is required
        password: Joi.string().required(),          // Password is required
        walletAddress: Joi.string().required(),     // Blockchain wallet address is required
    }
}

// Validation schema for adding a new NFT
const addNftValidation = {
    body: {
        name: Joi.string().required(),              // NFT name is required
        description: Joi.string().required(),       // NFT description is required
        collectionId: Joi.string().required(),      // Collection ID the NFT belongs to
        nftImage: Joi.string().required(),          // NFT image URL/path is required
        fileName: Joi.string().required(),          // Original filename is required
        attributes: Joi.array().required(),         // NFT attributes array is required
        isMinted: Joi.boolean().default(true)       // Minting status with default true
    },
}

// Validation schema for updating minted NFT status via API
const updateMintedNftForApiValidation = {
    query: {
        collectionAddress: Joi.string().required()  // Collection's blockchain address
    }
}

// Validation schema for file uploads
const fileUploadValidation = {
    file: Joi.object(fileObject)                   // Validates file upload against fileObject schema
}

// Export all validation schemas for use in routes
module.exports = {
    registerArtistValidation,
    updateMintedNftForApiValidation,
    addCollectionValidation,
    addNftValidation,
    artistLoginValidation,
    fileUploadValidation
};
