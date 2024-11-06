// Import required dependencies
const express = require('express');
const { adminController } = require('../../controllers');

// Import middleware and validation utilities
const validate = require('../../middleware/validation');
const { adminValidation } = require('../../validation');
const readClaims = require('../../middleware/claims');

// Create Express router instance
const router = express.Router();

// Authentication routes
router.post('/adminLogin', [validate(adminValidation.adminLoginValidation, ['body'])], adminController.adminLogin);

// Artist management routes
router.post('/createArtist', [validate(adminValidation.adminCreateArtistValidation, ['body']), readClaims], adminController.adminCreateArtist);
router.get('/artistList', [readClaims], adminController.adminArtistList);
router.get('/artistCollectionList', [validate(adminValidation.artistCollectionListValidation, ['query']), readClaims], adminController.artistCollectionList);

// User management routes
router.post('/createUser', [validate(adminValidation.adminCreateUserValidation, ['body']), readClaims], adminController.adminCreateUser);
router.get('/userList', [readClaims], adminController.adminUserList);
router.get('/userNfts', [readClaims], adminController.userNftsFn);

// Collection management routes
router.get('/collectionList', [readClaims], adminController.AllcollectionList);
router.get('/liveCollectionList', [readClaims], adminController.AllLiveCollectionList);
router.get('/recentActivityList', [readClaims], adminController.AllRecentActivityList);
router.get('/viewCollection', [validate(adminValidation.adminViewCollectionValidation, ['query']), readClaims], adminController.AllViewCollection);

// NFT management routes
router.get('/mintedNftList', [validate(adminValidation.adminNftListValidation, ['query']), readClaims], adminController.AllMintedNftList);
router.get('/unmintedNftList', [validate(adminValidation.adminNftListValidation, ['query']), readClaims], adminController.AllUnmintedNftList);
router.get('/nftList', [validate(adminValidation.adminNftListValidation, ['query']), readClaims], adminController.AllNftList);
router.get('/viewNft', [validate(adminValidation.adminViewNftValidation, ['query']), readClaims], adminController.AllViewNft);

// Profile management routes
router.get('/profileInfo', [readClaims], adminController.profileInfo);
router.post('/profileUpdate', [validate(adminValidation.profileUpdateValidation, ['body']), readClaims], adminController.profileUpdate);
router.post('/updatePassword', [validate(adminValidation.adminUpdatePassValidation, ['body']), readClaims], adminController.updatePassword);

// Export router for use in main application
module.exports = router;