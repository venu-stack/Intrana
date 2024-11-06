// Import required dependencies
const express = require('express');
const { userController } = require('../../controllers');

// Import middleware and validation utilities
const validate = require('../../middleware/validation');
const { userValidation } = require('../../validation');
const readClaims = require('../../middleware/claims');
const { sendNotification } = require('../../socketManager');

// Create Express router instance
const router = express.Router();

// Authentication and registration routes
router.post('/register', [validate(userValidation.addUserValidation, ['body'])], userController.userCreate);
router.get('/resendEmail/:userId', [validate(userValidation.resendEmailValidation, ['params'])], userController.resendEmailFn);
router.get('/verifyKyc/:userId', [validate(userValidation.verifyKycValidation, ['params'])], userController.verifyKycFn);
router.get('/verifyEmail', [validate(userValidation.emailVerifyValidation, ['query'])], userController.verificationEmail);
router.post('/login', [validate(userValidation.loginUserValidation, ['body'])], userController.loginUser);
router.post('/checkEmail', [validate(userValidation.checkEmailValidation, ['body'])], userController.checkEmail);
router.post('/checkUsername', [validate(userValidation.checkUsernameValidation, ['body'])], userController.checkUsername);

// Multi-Factor Authentication (MFA) routes
router.get('/generateQr', userController.generateQrFn);
router.get('/verifyMFAToken', userController.verifyTokenMFAFn);

// Collection management routes
router.get('/hotCollections', userController.hotCollectionsFn);
router.get('/allCollections', userController.allCollectionsFn);
router.get('/metadatauri/:collectionId/:nftId', [validate(userValidation.metaDataUriValidation, ['params'])], userController.metadataUriFn);

// Collection and NFT viewing routes
router.get('/userViewCollection', [validate(userValidation.userViewCollectionValidation, ['query'])], userController.userViewCollectionFn);
router.get('/nftListByCollectionId', [validate(userValidation.nftListByCollectionIdValidation, ['query'])], userController.nftListByCollectionIdFn);

// NFT marketplace routes - Fixed price and Auction listings
router.get('/allFixedSellNftList', [readClaims], userController.allFixedSellNftListFn);
router.get('/allAuctionSellNftList', [readClaims], userController.allAuctionSellNftListFn);

// User bid management routes
router.get('/allMyBidFixedNftList', [readClaims], userController.allMyBidFixedNftListFn);
router.get('/allMyBidAuctionNftList', [readClaims], userController.allMyBidAuctionNftListFn);

// Notification test route
router.get('/notification', async (req, res) => {
    sendNotification('654224f0eea4edfa01be0953', 'Hello Ajay')
    res.status(200).json('ok')
});

// Auction information route
router.get('/getAuctionInfo', [validate(userValidation.getAuctionInfoValidation, ['query']), readClaims], userController.getAuctionInfoFn);

// Test API endpoint
router.get('/testApi', [], userController.testApiFn);

// Export router for use in main application
module.exports = router;