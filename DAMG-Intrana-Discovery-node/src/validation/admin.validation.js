// Import Joi validation library
const Joi = require('joi');

// Validation schema for admin login
const adminLoginValidation = {
    body: {
        username: Joi.string().required(),
        password: Joi.string().required()
    }
}

// Validation schema for creating a new artist account by admin
const adminCreateArtistValidation = {
    body: {
        firstName: Joi.string().required(),
        surname: Joi.string().required(),
        email: Joi.string().email().required(),
        username: Joi.string().required(),
        password: Joi.string().required(),
        walletAddress: Joi.string().required(),
    }
}

// Validation schema for creating a new user account by admin
const adminCreateUserValidation = {
    body: {
        firstName: Joi.string().required(),
        surname: Joi.string().required(),
        email: Joi.string().email().required(),
        username: Joi.string().required(),
        password: Joi.string().required(),
        walletAddress: Joi.string().required(),
    }
}

// Validation schema for listing NFTs with pagination
const adminNftListValidation = {
    query: {
        collectionId: Joi.string().required(),
        page: Joi.number(),
        perPage: Joi.number(),
    }
}

// Validation schema for viewing a specific collection
const adminViewCollectionValidation = {
    query: {
        collectionId: Joi.string().required(),
    }
}

// Validation schema for listing collections by artist with pagination
const artistCollectionListValidation = {
    query: {
        artistId: Joi.string().required(),
        page: Joi.number(),
        perPage: Joi.number(),
    }
}

// Validation schema for viewing a specific NFT
const adminViewNftValidation = {
    query: {
        collectionId: Joi.string().required(),
        nftTableId: Joi.string().required(),
    }
}

// Validation schema for updating admin password
const adminUpdatePassValidation = {
    body: {
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().required(),
    }
}

// Validation schema for updating user profile information
const profileUpdateValidation = {
    body: {
        firstName: Joi.string().required(),
        surname: Joi.string().required(),
        username: Joi.string().required(),
    }
}

// Export all validation schemas
module.exports = { 
    artistCollectionListValidation, 
    profileUpdateValidation, 
    adminUpdatePassValidation, 
    adminViewNftValidation, 
    adminViewCollectionValidation, 
    adminLoginValidation, 
    adminCreateArtistValidation, 
    adminCreateUserValidation, 
    adminNftListValidation 
};