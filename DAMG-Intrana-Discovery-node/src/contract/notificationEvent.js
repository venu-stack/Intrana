// Import necessary modules and configurations
const { ethers } = require('ethers'); // Ethereum library for blockchain interactions
const config = require('../config/config'); // Configuration file containing environment-specific settings
const contractABI = require('../abi/notificationEvent.abi.json'); // ABI file defining contract's interface
const { default: axios } = require('axios'); // Axios for making HTTP requests
const { auctionInfoByIndexId } = require('../subGraphQuery/collection/getCollectionIndex'); // Query to fetch auction info
const { User, NotificatonModel } = require('../models'); // User and Notification models for database interactions
const { sendNotification } = require('../socketManager'); // Function to send real-time notifications

// Initialize connection to Ethereum provider (XDC Network in this case)
const provider = new ethers.providers.JsonRpcProvider(config.contract.XDC_RPC_URL);

// Set contract address from configuration
const contractAddress = config.contract.MARKET_PLACE_CONTRACT_ADDRESS;
console.log('contractAddress', contractAddress, 'rpc', config.contract.XDC_RPC_URL);

// Create a contract instance to interact with the blockchain
const contract = new ethers.Contract(contractAddress, contractABI, provider);

// Function to subscribe to and handle various blockchain events
function subscribeToEvents() {
    // Define event listeners for each blockchain event
    const eventListeners = {
        NFTAuctionBidAccepted: async (args) => {
            // Event handler for NFTAuctionBidAccepted; currently commented out
            // await handleEvent('NFTAuctionBidAccepted', args);
        },

        NFTAuctionPreviousBidAccepted: async (args) => {
            // Event handler for NFTAuctionPreviousBidAccepted; currently commented out
            // await handleEvent('NFTAuctionPreviousBidAccepted', args);
        },

        NFTBidPlaced: async (logs) => {
            // Event handler for NFTBidPlaced event
            const { args } = logs || {};
            // Fetch auction details using subgraph API
            const response = await axios.post(config.SUBGRAPH_API, auctionInfoByIndexId(Number(args.auctionIndex)));
            const { artist } = response.data?.data?.nftlistedForAuctions[0] || [];
            const user = await User.findOne({ walletAddress: artist }).lean();
            // Store notification in database
            const storeNotification = await NotificatonModel.create({
                isType: 1,
                recipient: user._id,
                message: 'new bid has been placed',
            });
            await storeNotification.save();
            // Send real-time notification
            sendNotification(user._id.toString(), 'new bid has been placed');
        },

        NFTFixedSaleOfferAccepted: async (args) => {
            // Event handler for NFTFixedSaleOfferAccepted; currently commented out
            // await handleEvent('NFTFixedSaleOfferAccepted', args);
        },

        NFTListedForAuction: async (args) => {
            // Event handler for NFTListedForAuction; currently commented out
            // await handleEvent('NFTListedForAuction', args);
        },

        NFTListedForSale: async (args) => {
            // Event handler for NFTListedForSale; currently commented out
            // await handleEvent('NFTListedForSale', args);
        },

        NFTOfferMadeOnFixedSale: async (args) => {
            // Event handler for NFTOfferMadeOnFixedSale; currently commented out
            // await handleEvent('NFTOfferMadeOnFixedSale', args);
        },

        NFTPurchasedFromFixedSale: async (args) => {
            // Event handler for NFTPurchasedFromFixedSale; currently commented out
            // await handleEvent('NFTPurchasedFromFixedSale', args);
        },

        NFTRemovedFromAuction: async (logs) => {
            // Event handler for NFTRemovedFromAuction event
            const { args } = logs || {};
            // Fetch auction and bid information
            const response = await axios.post(config.SUBGRAPH_API, auctionInfoByIndexId(Number(args.auctionIndex)));
            const bidInfo = response.data?.data?.nftlistedForAuctions[0].NFTBidPlaced || [];
            const bidderArray = bidInfo.map(item => item.bidder);
            // Use a Set to filter unique bidders
            const uniqueBidderSet = new Set(bidderArray);
            const uniqueBidderArray = Array.from(uniqueBidderSet);
            // Retrieve user information for unique bidders
            const users = await User.find({ walletAddress: { $in: uniqueBidderArray } }).lean();
            // Prepare notifications for each user
            const notificationData = users.map(user => ({
                isType: 2,
                recipient: user._id,
                message: 'The Auction has been Ended.',
            }));
            // Batch create notifications
            const notifications = await NotificatonModel.create(notificationData);
            const recipientIds = users.map(user => user._id.toString());
            // Send notifications to each recipient
            recipientIds.forEach(userId => sendNotification(userId, 'The Auction has been Ended.'));
        },

        NFTRemovedFromFixedSale: async (args) => {
            // Event handler for NFTRemovedFromFixedSale; logs args for now
            console.log(args);
            // await handleEvent('NFTRemovedFromFixedSale', args);
        },

        OfferAcceptedForNonListedNFT: async (args) => {
            // Event handler for OfferAcceptedForNonListedNFT; currently commented out
            // await handleEvent('OfferAcceptedForNonListedNFT', args);
        },

        OfferMadeForNonListedNFT: async (args) => {
            // Event handler for OfferMadeForNonListedNFT; currently commented out
            // await handleEvent('OfferMadeForNonListedNFT', args);
        }
    };

    // Attach event listeners to contract events
    Object.entries(eventListeners).forEach(([eventName, listener]) => {
        contract.on(eventName, (...args) => {
            listener(args[args.length - 1]); // Pass the last argument as event data
        });
    });

    console.log('Listening to Ethereum contract events...');

    // Keep the script running to listen for events
    process.stdin.resume();
}

// Start listening to events by subscribing
subscribeToEvents();
