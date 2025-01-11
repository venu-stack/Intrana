// Importing the Web3 library for blockchain interactions
const { Web3 } = require('web3');
// Importing the file system module for reading files
const fs = require("fs");

// Creating a new Web3 instance with the Alchemy API URL for Polygon Mumbai network
const web3 = new Web3('https://polygon-mumbai.g.alchemy.com/v2/Jj2_ZPvDzs3qxYOyUx-Uoq8JERV4Atm-');

// Reading the JSON file for NFTMarketplace contract and parsing it
const nftMarketplaceJson = JSON.parse(fs.readFileSync("../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json", "utf8"));
// Extracting the ABI (Application Binary Interface) from the JSON file
const nftMarketplaceABI = nftMarketplaceJson.abi;
// Defining the address of the NFTMarketplace contract
const nftMarketplaceAddress = '0xB01c60e0113Dae41D8b556D10a6b0d3e8ef87b44';

// Function to listen for past NFTListedForSale events
const listenForPastListNFTForFixedSaleEvents = (callback) => {
    // Creating a new contract instance with the NFTMarketplace ABI and address
    const contract = new web3.eth.Contract(nftMarketplaceABI, nftMarketplaceAddress);

    // Setting up a filter to fetch past events of type NFTListedForSale
    const filter = {
        fromBlock: 0, // Starting from the first block
        toBlock: 'latest', // Fetching up to the latest block
        topics: [web3.utils.keccak256('NFTListedForSale(address,uint256,uint256,address,uint256)')] // Topic for NFTListedForSale event
    };

    // Fetching past events for NFTListedForSale with the set filter
    contract.getPastEvents('NFTListedForSale', filter, (error, events) => {
        if (error) {
            console.error('Error fetching past events:', error);
        } else {
            // Iterating through the fetched events and executing the provided callback for each event
            events.forEach((event) => {
                callback(event.returnValues);
            });
        }
    });
};

// Exporting the function to listen for past NFTListedForSale events
module.exports = {
    listenForPastListNFTForFixedSaleEvents,
};
