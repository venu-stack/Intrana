// Import required dependencies
const mongoose = require("mongoose");
const Counter = require("./counter.model");
const schema = mongoose.Schema

// Define NFT schema with mongoose
const nftSchema = mongoose.Schema({
  // Auto-incrementing ID for NFTs within a collection
  nftId: {
    type: Number,
    require: true
  },
  // URL or path to NFT image
  nftImage: {
    type: String,
  },
  // Name of the NFT - required field
  name: {
    type: String,
    required: true
  },
  // Description of the NFT
  description: {
    type: String,
    require: true
  },
  // Reference to the collection this NFT belongs to
  collectionId: {
    type: schema.Types.ObjectId,
    ref: "collection", // References the collection model
    required: true,
  },
  // Array of NFT attributes/traits
  attributes: [
    {
      // Type of trait (e.g. "Background", "Eyes", etc)
      trait_type: {
        type: String,
      },
      // Value of the trait (e.g. "Blue", "Green", etc)
      value: {
        type: String,
      },
    },
  ],
  // Price of the NFT, defaults to 0
  price: {
    type: Number,
    default: 0
  },
  // Flag indicating if NFT has been minted on blockchain
  isMinted: {
    type: Boolean,
    default: false
  },
  // Timestamp when NFT was minted
  mintedCreatedDate: {
    type: String,
    default: null
  }
},
  // Add timestamps (createdAt, updatedAt) automatically
  { timestamps: true });

// Middleware that runs before saving a new NFT
nftSchema.pre("save", async function (next) {
  try {
    // Check if nftId needs to be assigned
    if (!this.nftId || isNaN(this.nftId)) {
      // Find and increment the counter for this collection
      const counter = await Counter.findOneAndUpdate(
        { collectionId: this.collectionId },
        { $inc: { nftId: 1 } }, // Increment nftId by 1
        { upsert: true, new: true } // Create counter if doesn't exist, return updated doc
      );

      // Handle case where counter.nftId is not a valid number
      if (isNaN(counter.nftId)) {
        this.nftId = 1; // Set to initial value
      } else {
        this.nftId = counter.nftId; // Use incremented counter value
      }
    }

    console.log("Saving NFT with nftId:", this.nftId);

    next();
  } catch (error) {
    console.error("Error in pre-save middleware:", error);
    next(error);
  }
});

// Create mongoose model from schema
const Nft = mongoose.model("Nft", nftSchema);

// Export the NFT model for use in other files
module.exports = Nft;
