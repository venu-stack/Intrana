// Import required modules and utility functions
const httpStatus = require('http-status'); // Utility for standardized HTTP status codes
const catchAsync = require('../utils/catchAsync'); // Utility function to handle async errors in controllers

// Importing various service functions from the admin service module
const { 
    login, 
    userNfts, 
    recentActivityList, 
    liveCollectionList, 
    artistOwnCollectionList, 
    userProfileUpdate, 
    myProfileInfo, 
    userUpdatePassword, 
    mintedNftList, 
    unmintedNftList, 
    viewNft, 
    viewCollection, 
    createArtist, 
    artistList, 
    nftList, 
    createUser, 
    userList, 
    collectionList 
} = require('../services/admin.service');

// Controller for admin login
const adminLogin = catchAsync(async (req, res) => {
    await login(req, res); // Calls the login service function to handle admin login
});

// Controller for fetching user NFTs
const userNftsFn = catchAsync(async (req, res) => {
    await userNfts(req, res); // Calls userNfts service function to get NFTs owned by a user
});

// Controller for creating a new artist
const adminCreateArtist = catchAsync(async (req, res) => {
    await createArtist(req, res); // Calls createArtist service to add a new artist to the platform
});

// Controller to get the list of all artists
const adminArtistList = catchAsync(async (req, res) => {
    await artistList(req, res); // Calls artistList service to fetch all artists
});

// Controller to get the list of all users
const adminUserList = catchAsync(async (req, res) => {
    await userList(req, res); // Calls userList service to fetch all users
});

// Controller to create a new user
const adminCreateUser = catchAsync(async (req, res) => {
    await createUser(req, res); // Calls createUser service to add a new user to the platform
});

// Controller to fetch all collections
const AllcollectionList = catchAsync(async (req, res) => {
    await collectionList(req, res); // Calls collectionList service to fetch all collections
});

// Controller to fetch all live collections
const AllLiveCollectionList = catchAsync(async (req, res) => {
    await liveCollectionList(req, res); // Calls liveCollectionList service to fetch collections currently live
});

// Controller to fetch recent activity
const AllRecentActivityList = catchAsync(async (req, res) => {
    await recentActivityList(req, res); // Calls recentActivityList service to get recent activity on the platform
});

// Controller to fetch collections specific to an artist
const artistCollectionList = catchAsync(async (req, res) => {
    await artistOwnCollectionList(req, res); // Calls artistOwnCollectionList to get an artist's collections
});

// Controller to fetch all NFTs
const AllNftList = catchAsync(async (req, res) => {
    await nftList(req, res); // Calls nftList service to get all NFTs
});

// Controller to view a specific collection
const AllViewCollection = catchAsync(async (req, res) => {
    await viewCollection(req, res); // Calls viewCollection service to fetch details of a specific collection
});

// Controller to view a specific NFT
const AllViewNft = catchAsync(async (req, res) => {
    await viewNft(req, res); // Calls viewNft service to fetch details of a specific NFT
});

// Controller to fetch a list of minted NFTs
const AllMintedNftList = catchAsync(async (req, res) => {
    await mintedNftList(req, res); // Calls mintedNftList to get a list of all minted NFTs
});

// Controller to fetch a list of unminted NFTs
const AllUnmintedNftList = catchAsync(async (req, res) => {
    await unmintedNftList(req, res); // Calls unmintedNftList to get a list of all unminted NFTs
});

// Controller to get profile information of the current user
const profileInfo = catchAsync(async (req, res) => {
    await myProfileInfo(req, res); // Calls myProfileInfo to fetch the current user's profile information
});

// Controller to update user password
const updatePassword = catchAsync(async (req, res) => {
    await userUpdatePassword(req, res); // Calls userUpdatePassword to change user's password
});

// Controller to update profile information of the current user
const profileUpdate = catchAsync(async (req, res) => {
    await userProfileUpdate(req, res); // Calls userProfileUpdate to update user's profile details
});

// Export all controllers as a module to be used in routes
module.exports = {
    adminLogin, 
    userNftsFn, 
    AllRecentActivityList, 
    profileUpdate, 
    AllLiveCollectionList, 
    updatePassword, 
    profileInfo, 
    AllUnmintedNftList, 
    AllMintedNftList, 
    adminCreateArtist, 
    adminArtistList, 
    adminCreateUser, 
    adminUserList, 
    artistCollectionList, 
    AllcollectionList, 
    AllNftList, 
    AllViewCollection, 
    AllViewNft
};
