// Import mongoose ODM library for MongoDB
const mongoose = require('mongoose');

// Define user schema with mongoose
const userSchema = new mongoose.Schema({
    // User's first name - required and trimmed
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    // User's surname - required and trimmed 
    surname: {
        type: String,
        required: true,
        trim: true,
    },
    // User's email - required, unique, trimmed and converted to lowercase
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    // Username - required, unique and trimmed
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    // User's password - required
    password: {
        type: String,
        required: true,
    },
    // User's role identifier - required
    roleId: {
        type: Number,
        required: true,
    },
    // Flag indicating if user's email is verified
    isVerified: {
        type: Boolean,
        default: false, // Initially, the user is not verified
    },
    // Token used for email verification
    verificationToken: {
        type: String,
    },
    // Timestamp when verification token was created
    verificationTokenTimestamp: {
        type: Date,
    },
    // Secret key for Multi-Factor Authentication
    MFASecret: {
        type: String,
        default: null
    },
    // Flag indicating if 2FA is enabled for user
    is2FAEnabled: {
        type: Boolean,
        default: false
    },
    // Flag indicating if Know Your Customer verification is complete
    isKyc: {
        type: Boolean,
        default: false
    },
    // Unique internal identifier for user
    intranaId: {
        type: String,
        unique: true,
    },
    // User's blockchain wallet address
    walletAddress: {
        type: String,
        unique: true,
        required: true
    },
    // User's current socket connection ID for real-time features
    socketId: {
        type: String,
        default: null
    }
});

// Middleware that runs before saving user document
// Generates a unique INTRANA ID combining prefix, timestamp and random number
userSchema.pre("save", async function (next) {
    const prefix = 'INTRANA';
    const timestamp = Date.now();
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    // Combine prefix, timestamp and random digits to create unique ID
    this.intranaId = `${prefix}${timestamp + randomDigits}`;
    next();
});

// Create mongoose model from schema
const User = mongoose.model('User', userSchema);

// Export the user model for use in other files
module.exports = User;
