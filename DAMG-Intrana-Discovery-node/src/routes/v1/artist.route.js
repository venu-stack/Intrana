// Import required dependencies
const express = require('express');
const { artistController } = require('../../controllers');

// Import middleware and validation utilities
const upload = require('../../middleware/multer');
const validate = require('../../middleware/validation');
const { artistValidation } = require('../../validation');
const readClaims = require('../../middleware/claims');

// Create Express router instance
const router = express.Router();

// Collection management routes
router.post('/createCollection', [validate(artistValidation.addCollectionValidation, ['body']), readClaims], artistController.createCollectionFn);
router.get('/updateIsLaunchCollectionForApi', artistController.updateIsLaunchCollectionFn);

// File upload and authentication routes
router.post('/fileUpload', upload.single('file'), [validate(artistValidation.fileUploadValidation, ['file']), readClaims], artistController.uploadImagesFn);
router.post('/artistLogin', [validate(artistValidation.artistLoginValidation, ['body'])], artistController.artistLogin);
router.post('/registerArtist', [validate(artistValidation.registerArtistValidation, ['body'])], artistController.registerArtistFn);

// NFT creation and minting routes
router.post('/createNft', [validate(artistValidation.addNftValidation, ['body'])], artistController.createNftFn);
router.get('/updateMintedNftForApi', [validate(artistValidation.updateMintedNftForApiValidation, ['query'])], artistController.updateMintedNftForApiFn);

// Artist portfolio routes
router.get('/myOwnNft', [readClaims], artistController.myOwnNftFn);

// Fixed price NFT sale routes
router.get('/myFixedSellNftList', [readClaims], artistController.myFixedSellNftListFn);
router.get('/fixedNftUserBidList', [readClaims], artistController.fixedNftUserBidListFn);

// Auction NFT routes
router.get('/myAuctionSellNftList', [readClaims], artistController.myAuctionSellNftListFn);
router.get('/myAuctionBidList', [readClaims], artistController.myAuctionBidListFn);

// Offers management routes
router.get('/myOffersSellNftList', [readClaims], artistController.myOffersSellNftListFn);
router.get('/myOffersBidList', [readClaims], artistController.myOffersBidListFn);

// Bid management routes
router.get('/allNftBidList', [readClaims], artistController.allNftBidListFn);
router.get('/myNftBidList', [readClaims], artistController.myNftBidListFn);

// Export router for use in main application
module.exports = router;