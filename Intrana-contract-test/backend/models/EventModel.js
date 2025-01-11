// Importing mongoose for MongoDB interaction
const mongoose = require('mongoose');

// Defining the schema for the FixedPriceSale model
const fixedPriceSaleSchema = new mongoose.Schema({
    // Field to store the index of the fixed sale
    fixedSaleIndex: Number,
    // Field to store the contract address of the NFT
    nftContract: String,
    // Field to store the token ID of the NFT
    tokenId: Number,
    // Field to store the price of the NFT
    price: Number,
    // Field to store the name of the artist
    artist: String,
    // Field to store the timestamp of the sale
    timestamp: Number,
});

// Exporting the FixedPriceSale model
module.exports = mongoose.model('FixedPriceSale', fixedPriceSaleSchema);
