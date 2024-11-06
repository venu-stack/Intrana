// Import Joi validation library for input validation
const Joi = require('joi');

// Validation schema for adding a new user
const addUserValidation = {
  body: {
    firstName: Joi.string().required(),         // User's first name is required
    surname: Joi.string().required(),           // User's surname is required 
    email: Joi.string().email().required(),     // Valid email address is required
    username: Joi.string().required(),          // Username is required
    password: Joi.string().required(),          // Password is required
    walletAddress: Joi.string().required(),     // Blockchain wallet address is required
  }
}

// Validation schema for user login
const loginUserValidation = {
  body: {
    username: Joi.string().required(),          // Username is required
    password: Joi.string().required()           // Password is required
  }
}

// Validation schema for checking if email exists
const checkEmailValidation = {
  body: {
    email: Joi.string().required(),             // Email to check is required
  }
}

// Validation schema for checking if username exists
const checkUsernameValidation = {
  body: {
    username: Joi.string().required(),          // Username to check is required
  }
}

// Validation schema for email verification
const emailVerifyValidation = {
  query: {
    token: Joi.string().required(),             // Verification token is required
    userId: Joi.string().required()             // User ID is required
  }
}

// Validation schema for resending verification email
const resendEmailValidation = {
  params: {
    userId: Joi.string().required(),            // User ID is required
  }
}

// Validation schema for KYC verification
const verifyKycValidation = {
  params: {
    userId: Joi.string().required(),            // User ID is required
  }
}

// Validation schema for viewing a collection
const userViewCollectionValidation = {
  query: {
    collectionId: Joi.string().required(),      // Collection ID is required
  }
}

// Validation schema for getting auction information
const getAuctionInfoValidation = {
  query: {
    auctionIndexId: Joi.string().required(),    // Auction index ID is required
  }
}

// Validation schema for listing NFTs by collection ID with pagination
const nftListByCollectionIdValidation = {
  query: {
    collectionId: Joi.string().required(),      // Collection ID is required
    page: Joi.number(),                         // Optional page number for pagination
    perPage: Joi.number(),                      // Optional items per page
  }
}

// Validation schema for NFT metadata URI
const metaDataUriValidation = {
  params: {
    collectionId: Joi.string().required(),      // Collection ID is required
    nftId: Joi.string().required(),             // NFT ID is required
  }
}

// Export all validation schemas
module.exports = {
  verifyKycValidation,
  resendEmailValidation,
  metaDataUriValidation,
  getAuctionInfoValidation,
  nftListByCollectionIdValidation,
  userViewCollectionValidation,
  addUserValidation,
  emailVerifyValidation,
  loginUserValidation,
  checkEmailValidation,
  checkUsernameValidation
};