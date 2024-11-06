// Import mongoose ODM library for MongoDB
const mongoose = require("mongoose");

// Define counter schema for auto-incrementing collection IDs
const counterSchema = new mongoose.Schema({
    // ID field to identify the counter, required string
    _id: { type: String, required: true },
    // Sequence number that gets incremented, defaults to 1
    seq: { type: Number, default: 1 },
});

// Create mongoose model from schema
const CollectionCounter = mongoose.model("CollectionCounter", counterSchema);

// Export the counter model for use in other files
module.exports = CollectionCounter 