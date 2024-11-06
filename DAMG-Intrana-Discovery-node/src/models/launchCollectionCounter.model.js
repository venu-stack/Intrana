// Import mongoose ODM library for MongoDB
const mongoose = require("mongoose");

// Define schema for tracking total number of launched collections
const LaunchCollectionCounterSchema = new mongoose.Schema({
    // Counter to keep track of total launched collections
    totalLaunchCollection: {
        type: Number, // Number type for the counter
        default: 0,   // Initialize counter to 0
    },
});

// Create mongoose model from schema
const LaunchCollectionCounter = mongoose.model("LaunchCollectionCounter", LaunchCollectionCounterSchema);

// Export the counter model for use in other files
module.exports = LaunchCollectionCounter