// Import mongoose ODM library for MongoDB
const mongoose = require("mongoose");
// Get Schema class from mongoose
const schema = mongoose.Schema;

// Define counter schema for tracking NFT IDs within collections
const counterSchema = new mongoose.Schema({
    // Reference to the collection this counter belongs to
    collectionId: {
        type: schema.Types.ObjectId, // MongoDB ObjectId type
        ref: "collection", // References the collection model
        required: true, // Must be provided
        unique: true, // Only one counter per collection
    },
    // Auto-incrementing ID for NFTs in the collection
    nftId: {
        type: Number,
        default: 1, // Start counting from 1
    },
});

// Create mongoose model from schema
const Counter = mongoose.model("Counter", counterSchema);

// Export the counter model for use in other files
module.exports = Counter