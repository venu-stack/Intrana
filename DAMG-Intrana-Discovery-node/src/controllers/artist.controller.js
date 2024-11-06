// Import required modules and utility functions
const httpStatus = require('http-status'); // HTTP status codes utility
const catchAsync = require('../utils/catchAsync'); // Async error handling utility

// Import artist service functions
const { 
    allNftBidList, 
    registerArtist,
    myOffersBidList,
    myAuctionBidList,
    fixedNftUserBidList,
    myOffersSellNftList,
    myAuctionSellNftList,
    updateMintedNftForApi,
    updateIsLaunchCollectionForApi,
    myNftBidList,
    myFixedSellNftList,
    myOwnNft,
    createCollection,
    login,
    createNft,
    uploadImage 
} = require('../services/artist.service');

// Controller for artist login
const artistLogin = catchAsync(async (req, res) => {
    await login(req, res)
});

// Controller for registering a new artist
const registerArtistFn = catchAsync(async (req, res) => {
    await registerArtist(req, res)
});

// Controller for creating a new collection
const createCollectionFn = catchAsync(async (req, res, next) => {
    await createCollection(req, res, next)
});

// Controller for uploading images
const uploadImagesFn = catchAsync(async (req, res) => {
    await uploadImage(req, res)
});

// Controller for creating a new NFT
const createNftFn = catchAsync(async (req, res) => {
    await createNft(req, res)
});

// Controller to fetch artist's owned NFTs
const myOwnNftFn = catchAsync(async (req, res) => {
    await myOwnNft(req, res)
})

// Controller to fetch artist's NFTs listed for fixed price sale
const myFixedSellNftListFn = catchAsync(async (req, res) => {
    await myFixedSellNftList(req, res)
})

// Controller to fetch bids on fixed price NFTs by users
const fixedNftUserBidListFn = catchAsync(async (req, res) => {
    await fixedNftUserBidList(req, res)
})

// Controller to fetch artist's NFTs listed for auction
const myAuctionSellNftListFn = catchAsync(async (req, res) => {
    await myAuctionSellNftList(req, res)
})

// Controller to fetch artist's NFTs with offers
const myOffersSellNftListFn = catchAsync(async (req, res) => {
    await myOffersSellNftList(req, res)
})

// Controller to fetch all NFT bids
const allNftBidListFn = catchAsync(async (req, res) => {
    await allNftBidList(req, res)
})

// Controller to fetch bids on artist's NFTs
const myNftBidListFn = catchAsync(async (req, res) => {
    await myNftBidList(req, res)
})

// Controller to update collection launch status
const updateIsLaunchCollectionFn = catchAsync(async (req, res) => {
    await updateIsLaunchCollectionForApi(req, res)
})

// Controller to update NFT minting status
const updateMintedNftForApiFn = catchAsync(async (req, res) => {
    await updateMintedNftForApi(req, res)
})

// Controller to fetch artist's auction bids
const myAuctionBidListFn = catchAsync(async (req, res) => {
    await myAuctionBidList(req, res)
})

// Controller to fetch artist's offers/bids
const myOffersBidListFn = catchAsync(async (req, res) => {
    await myOffersBidList(req, res)
})

// Export all controller functions
module.exports = {
    createCollectionFn,
    registerArtistFn,
    myOffersBidListFn,
    myAuctionBidListFn,
    fixedNftUserBidListFn,
    myOffersSellNftListFn,
    myAuctionSellNftListFn,
    updateMintedNftForApiFn,
    updateIsLaunchCollectionFn,
    myNftBidListFn,
    allNftBidListFn,
    myFixedSellNftListFn,
    artistLogin,
    createNftFn,
    myOwnNftFn,
    uploadImagesFn
};
