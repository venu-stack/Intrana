// Import required modules and utility functions
const httpStatus = require('http-status'); // HTTP status codes utility
const catchAsync = require('../utils/catchAsync'); // Async error handling utility

// Import user service functions
const {
   register,
   allMyBidAuctionNftList,
   allMyBidFixedNftList,
   allAuctionSellNftList,
   getAuctionInfo,
   allFixedSellNftList,
   nftListByCollectionId,
   userViewCollection,
   allCollections,
   metadataUri,
   hotCollections,
   testApi,
   verifyEmail,
   login,
   checkEmailExist,
   checkUserNameExist,
   generateSecret,
   generateQr,
   verifyTokenMFA,
   resendEmail,
   verifyKyc
} = require('../services/user.service');

// Controller for user registration
const userCreate = catchAsync(async (req, res) => {
   await register(req, res)
});

// Controller for email verification
const verificationEmail = catchAsync(async (req, res) => {
   await verifyEmail(req, res)
});

// Controller for user login
const loginUser = catchAsync(async (req, res) => {
   await login(req, res)
});

// Controller to check if email exists
const checkEmail = catchAsync(async (req, res) => {
   await checkEmailExist(req, res)
});

// Controller for KYC verification
const verifyKycFn = catchAsync(async (req, res) => {
   await verifyKyc(req, res)
});

// Controller to check if username exists
const checkUsername = catchAsync(async (req, res) => {
   await checkUserNameExist(req, res)
});

// Controller to generate secret for MFA
const generateSecretFn = catchAsync(async (req, res) => {
   await generateSecret(req, res)
});

// Controller to generate QR code for MFA
const generateQrFn = catchAsync(async (req, res) => {
   await generateQr(req, res)
});

// Controller to verify MFA token
const verifyTokenMFAFn = catchAsync(async (req, res) => {
   await verifyTokenMFA(req, res)
});

// Controller to resend verification email
const resendEmailFn = catchAsync(async (req, res) => {
   await resendEmail(req, res)
});

// Controller for testing API
const testApiFn = catchAsync(async (req, res) => {
   await testApi(req, res)
});

// Controller to fetch hot/trending collections
const hotCollectionsFn = catchAsync(async (req, res) => {
   await hotCollections(req, res)
});

// Controller to fetch all collections
const allCollectionsFn = catchAsync(async (req, res) => {
   await allCollections(req, res)
});

// Controller to fetch metadata URI
const metadataUriFn = catchAsync(async (req, res) => {
   await metadataUri(req, res)
});

// Controller to view collection details
const userViewCollectionFn = catchAsync(async (req, res) => {
   await userViewCollection(req, res)
});

// Controller to fetch NFTs by collection ID
const nftListByCollectionIdFn = catchAsync(async (req, res) => {
   await nftListByCollectionId(req, res)
});

// Controller to fetch all fixed-price NFTs for sale
const allFixedSellNftListFn = catchAsync(async (req, res) => {
   await allFixedSellNftList(req, res)
});

// Controller to fetch user's bids on fixed-price NFTs
const allMyBidFixedNftListFn = catchAsync(async (req, res) => {
   await allMyBidFixedNftList(req, res)
});

// Controller to fetch user's bids on auction NFTs
const allMyBidAuctionNftListFn = catchAsync(async (req, res) => {
   await allMyBidAuctionNftList(req, res)
});

// Controller to fetch all NFTs available for auction
const allAuctionSellNftListFn = catchAsync(async (req, res) => {
   await allAuctionSellNftList(req, res)
});

// Controller to fetch auction details
const getAuctionInfoFn = catchAsync(async (req, res) => {
   await getAuctionInfo(req, res)
});

// Export all controller functions
module.exports = {
   userCreate,
   allMyBidAuctionNftListFn,
   allAuctionSellNftListFn,
   verificationEmail,
   loginUser,
   checkEmail,
   allMyBidFixedNftListFn,
   checkUsername,
   generateSecretFn,
   generateQrFn,
   verifyTokenMFAFn,
   testApiFn,
   hotCollectionsFn,
   allCollectionsFn,
   metadataUriFn,
   allFixedSellNftListFn,
   getAuctionInfoFn,
   userViewCollectionFn,
   nftListByCollectionIdFn,
   resendEmailFn,
   verifyKycFn
};
