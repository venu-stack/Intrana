const express = require('express');
const mongoose = require('mongoose');
const web3utils = require('./utils/web3utils');
const fixedPriceSaleRoutes = require('./routes/events');
const fs = require("fs");
const { Web3 } = require('web3');
const web3 = new Web3('https://polygon-mumbai.g.alchemy.com/v2/Jj2_ZPvDzs3qxYOyUx-Uoq8JERV4Atm-');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/nft_marketplace', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connection established successfully');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});

app.use(express.json());

// Use routes
app.use('/fixedPriceSale', fixedPriceSaleRoutes);

// Account that will be used to call the function
const fromAccount = '0xcC59A62Edb26Ad08E15C896a255dED7eA3Ebae1C';

// NFT marketplace contract
const nftMarketplaceJson = JSON.parse(fs.readFileSync("../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json", "utf8"));
const nftMarketplaceABI = nftMarketplaceJson.abi;
const nftMarketplaceAddress = '0xB01c60e0113Dae41D8b556D10a6b0d3e8ef87b44';
const nftMarketplaceContract = new web3.eth.Contract(nftMarketplaceABI, nftMarketplaceAddress);

// Function to list an NFT for fixed sale
async function listNFTForFixedSale(tokenId, price, nftContract) {
    try {
        // Create a transaction object
        const txObject = {
            from: fromAccount,
            to: nftMarketplaceAddress,
            data: nftMarketplaceContract.methods.listNFTForFixedSale(tokenId, price, nftContract).encodeABI(),
        };

        // Sign and send the transaction
        const receipt = await web3.eth.sendTransaction(txObject);
        console.log('Transaction successful:', receipt);
    } catch (error) {
        console.error('Error listing NFT for fixed sale:', error);
    }
}

// Call the function to list an NFT for fixed sale
const tokenId = 1;
const price = 50;
const nftContract = '0x60acDFF0A3BC60834c38A1C33191D07eD951c3b1';

listNFTForFixedSale(tokenId, price, nftContract);

// Start listening for past events
web3utils.listenForPastListNFTForFixedSaleEvents((eventData) => {
    const apiUrl = 'http://localhost:3000/listNFTForFixedSale';
    axios
        .post(apiUrl, eventData)
        .then((response) => {
            console.log('Past event data sent successfully:', response.data);
        })
        .catch((error) => {
            console.error('Error sending past event data:', error);
        });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
