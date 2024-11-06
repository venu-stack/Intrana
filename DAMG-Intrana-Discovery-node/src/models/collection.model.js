// Import required dependencies
const mongoose = require("mongoose");
const CollectionCounter = require("./collection.Counter.model");
const Counter = require("./counter.model");

// Define the collection schema with mongoose
const collectionSchema = new mongoose.Schema({
    // URL or path to collection image
    collectionImage: {
        type: String,
    },
    // Auto-incrementing unique identifier for the collection
    collectionIncId: {
        type: Number,
        unique: true,
    },
    // Blockchain address associated with the collection
    collectionAddress: {
        type: String,
        default: null,
    },
    // Collection name - required and must be unique
    name: {
        type: String,
        required: true,
        unique: true,
    },
    // Description of the collection
    description: {
        type: String,
    },
    // Total number of NFTs in the collection
    totalNftCount: {
        type: Number,
    },
    // Flag indicating if collection is launched
    isLaunch: {
        type: Boolean,
        default: false
    },
    // ID of user who owns/created the collection
    userId: {
        type: String,
    },
},
    // Add timestamps (createdAt, updatedAt) automatically
    { timestamps: true });


// Middleware that runs before saving a new collection
collectionSchema.pre("save", async function (next) {
    const doc = this;
    // Only proceed if document is new
    if (!doc.isNew) {
        return next();
    }

    try {
        // Find and increment the counter for collection IDs
        const counter = await CollectionCounter.findByIdAndUpdate(
            { _id: "collectionIncId" }, // Counter document ID
            { $inc: { seq: 1 } }, // Increment sequence by 1
            { upsert: true, new: true } // Create if doesn't exist, return updated doc
        );
        // Assign the new sequence number to collection
        doc.collectionIncId = counter.seq;
        next();
    } catch (error) {
        next(error);
    }
});

// Create the Collection model from schema
const Collection = mongoose.model("Collection", collectionSchema);

// Export the Collection model
module.exports = Collection;
