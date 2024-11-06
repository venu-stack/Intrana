// Import required dependencies and configurations
const httpStatus = require("http-status");
const { User, Collection, Nft, LaunchCollectionCounter } = require("../models")
const getFilePath = require("../utils/getFilePath")
const getS3Params = require('../utils/getS3Params');
const s3 = require('../utils/s3Storage');
const bcrypt = require('bcrypt');
const util = require('util');
const config = require("../config/config");
const moveObjectS3 = require("../utils/moveObjectS3");
const Counter = require("../models/counter.model");
const s3Upload = util.promisify(s3.upload).bind(s3);
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const path = require("path");
const { default: axios } = require("axios");
const { getCollectionIndex, contractAddressWiseCollectionInfo, getNewCollection, getCollectionNewNFTS, nftsListedForFixSale, getFixlistedOffers, auctionList, getAuctionsOfferInfo, getOffersByWalletAddress, getOffersBYcontrcatAddressAndTokenId } = require("../subGraphQuery/collection/getCollectionIndex");
const { getTokenByWalletAddress } = require("../subGraphQuery/Nft/nftQuery");
const crypto = require('crypto');
const sendVerificationEmail = require("./email.service");

// Handle artist login
const login = async (req, res) => {
    try {
        const { username, password } = req.body; // Get credentials from request body

        // Find artist by email or username
        const artist = await User.findOne({ $or: [{ email: username }, { username: username }], roleId: 2 });

        if (!artist) {
            return res.status(httpStatus.NOT_FOUND).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, artist.password);
        if (!passwordMatch) {
            return res.status(httpStatus.NOT_FOUND).json({ error: 'Wrong password' });
        }

        // Generate 2FA secret if not enabled
        if (!artist.is2FAEnabled) {
            const secret = speakeasy.generateSecret({ name: artist.username, options: { encoding: 'base32' } });
            artist.MFASecret = secret.base32;
        }
        await artist.save();

        // Return success response with user details
        return res.status(httpStatus.OK).json({ 
            message: 'login success.', 
            userId: artist._id, 
            walletAddress: artist.walletAddress, 
            isKyc: artist.isKyc, 
            isEmail: artist.isVerified, 
            is2FAEnabled: artist.is2FAEnabled
        });

    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
}

// Handle artist registration
const registerArtist = async (req, res) => {
    try {
        const { firstName, surname, email, username, password, walletAddress } = req.body;

        // Generate verification token and hash password
        const { token, timestamp } = generateVerificationToken();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new artist user
        const user = new User({
            firstName,
            surname,
            email,
            username,
            isVerified: true,
            password: hashedPassword,
            walletAddress: walletAddress?.toLowerCase(),
            verificationToken: token,
            verificationTokenTimestamp: timestamp,
            roleId: 2 // Role ID 2 for artists
        });

        // Generate 2FA secret
        const secret = speakeasy.generateSecret({ name: user.username, options: { encoding: 'base32' } });
        user.MFASecret = secret.base32;

        await user.save();

        // Send verification email
        await sendVerificationEmail(email, token, user._id.toString(), user.roleId)

        return res.status(httpStatus.OK).json({ message: 'Registration successful.', userId: user._id });

    } catch (error) {
        // Handle duplicate key errors
        if (error.code === 11000) {
            console.error(error);
            if (error.keyPattern.email) {
                res.status(httpStatus.BAD_REQUEST).json({ error: 'Email already exists' });
            } else if (error.keyPattern.username) {
                res.status(httpStatus.BAD_REQUEST).json({ error: 'Username already exists' });
            } else {
                res.status(httpStatus.BAD_REQUEST).json({ error: 'Duplicate key error' });
            }
        } else {
            console.error(error);
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
        }
    }
};

// Generate verification token and timestamp
const generateVerificationToken = () => {
    const token = crypto.randomBytes(32).toString('hex');
    const timestamp = new Date();
    return { token, timestamp };
};

// Create new NFT collection
const createCollection = async (req, res) => {
    try {
        const adminId = req.claims;
        const { name, description, collectionImage, fileName } = req?.body || {}

        // Verify artist user
        const admin = await User.findOne({ _id: adminId.userId, roleId: { $in: [2] } });
        if (!admin) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }

        // Check if collection name exists
        const isCollectionExist = await Collection.find({ name: name })
        if (isCollectionExist.length > 0) {
            return res.status(httpStatus.CONFLICT).json({ message: "collection name already exist." })
        }

        // Generate file path and move image to S3
        const filePath = await getFilePath(name, 'collections', null, null)
        if (!filePath.status) return res.status(httpStatus.NOT_ACCEPTABLE).json({ message: filePath.message })
        const finalFilePath = filePath.filePath + '/' + fileName
        await moveObjectS3(collectionImage, finalFilePath)

        // Create collection record
        const collectionSave = new Collection({
            name: name,
            description: description,
            collectionImage: 'https://' + config.s3.bucket + '.s3.amazonaws.com/' + finalFilePath,
            userId: adminId.userId
        })
        const collectionData = await collectionSave.save()

        // Initialize counter for NFT IDs
        await Counter.create({
            collectionId: collectionData._id,
            nftId: 0
        })

        return res.status(httpStatus.OK).json({ message: 'collection created successfully.', collectionData })

    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
}

// Update minted NFT status
const updateMintedNft = async (collectionAddress) => {
    try {
        // Aggregate pipeline to get collection and NFT data
        const aggregationPipeline = [
            {
                $match: { collectionAddress: collectionAddress },
            },
            {
                $lookup: {
                    from: 'nfts',
                    localField: '_id',
                    foreignField: 'collectionId',
                    as: 'nfts',
                },
            },
            {
                $project: {
                    _id: 1,
                    mintedCount: {
                        $size: {
                            $filter: {
                                input: '$nfts',
                                as: 'nft',
                                cond: { $eq: ['$$nft.isMinted', true] },
                            },
                        }
                    },
                },
            },
        ];

        // Get current minted count from database
        const collection1 = await Collection.aggregate(aggregationPipeline);
        const nftMintedCount = collection1[0].mintedCount
        const collectionId = collection1[0]._id

        // Get minted count from blockchain
        const response = await axios.post(config.SUBGRAPH_API, contractAddressWiseCollectionInfo(collectionAddress));
        const launchCollectionData = response?.data?.data?.collections || [];
        const nftMintedCountFromSubgraph = launchCollectionData[0]?.totalTokens || 0;

        // Update database if blockchain has more minted NFTs
        if (nftMintedCount < parseInt(nftMintedCountFromSubgraph)) {
            const diffrence = nftMintedCountFromSubgraph - nftMintedCount

            const fetchNewNftRecords = await axios.post(config.SUBGRAPH_API, getCollectionNewNFTS(collectionAddress, diffrence));
            const newNftData = fetchNewNftRecords.data.data.collections;

            await Promise.all(
                newNftData[0].tokens.map(async ({ tokenID, createdAt }) => {
                    await Nft.updateOne(
                        { nftId: parseInt(tokenID), collectionId: collectionId },
                        { $set: { isMinted: true, mintedCreatedDate: createdAt } }
                    );
                })
            );
        }

        return true
    } catch (error) {
        throw error
    }
}

// Update launched collection status
const updateIsLaunchCollection = async () => {
    try {
        // Get/initialize launch collection counter
        var launchCollectionCount = await LaunchCollectionCounter.findOne({})
        if (!launchCollectionCount) {
            var launchCollectionCount = await LaunchCollectionCounter.create({ totalLaunchCollection: 0 })
        }

        // Get deployed collection count from blockchain
        const response = await axios.post(config.SUBGRAPH_API, getCollectionIndex());
        const deployCollectionCount = response.data?.data?.nftcollectionCreateds[0]?.nftCollectionIndex || 0;

        // Update database if blockchain has more deployed collections
        if (deployCollectionCount != launchCollectionCount.totalLaunchCollection) {
            const diffrence = deployCollectionCount - launchCollectionCount.totalLaunchCollection
            var latestCollectionData = await axios.post(config.SUBGRAPH_API, getNewCollection(diffrence));
            var latestCollectionData = latestCollectionData?.data?.data?.nftcollectionCreateds || []

            await Promise.all(
                latestCollectionData.map(async ({ collectionId, collectionAddress }) => {
                    const md = await Collection.updateOne(
                        { collectionIncId: collectionId },
                        { $set: { collectionAddress: collectionAddress, isLaunch: true } }
                    );
                    if (md.modifiedCount > 0) {
                        await LaunchCollectionCounter.findOneAndUpdate({}, { $inc: { totalLaunchCollection: 1 } })
                    }
                })
            )
        }
        return true
    } catch (error) {
        throw error
    }
}

// API endpoint to update launched collection status
const updateIsLaunchCollectionForApi = async (req, res) => {
    try {
        const result = await updateIsLaunchCollection();
        if (result) {
            return res.status(httpStatus.OK).json({ message: 'collection deployed succefully' })
        }
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
}

// API endpoint to update minted NFT status
const updateMintedNftForApi = async (req, res) => {
    try {
        const { collectionAddress } = req.query || {}
        const result = await updateMintedNft(collectionAddress);
        if (result) {
            return res.status(httpStatus.OK).json({ message: 'NFT minted succefully' })
        }
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
}

// Upload image to S3
const uploadImage = async (req, res) => {
    try {
        // Verify artist user
        const adminId = req.claims;
        const admin = await User.findOne({ _id: adminId.userId, roleId: { $in: [1, 2] } });
        if (!admin) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }

        if (!req.file) return res.status(httpStatus.NOT_FOUND).json({ message: 'file not found.' })
        
        // Generate file path and upload to S3
        const file = req.file;
        const filePath = await getFilePath(null, null, null, file)
        if (!filePath.status) return res.status(httpStatus.NOT_ACCEPTABLE).json({ message: filePath.message })
        const params = getS3Params(filePath.filePath, file)
        const data = await s3Upload(params);
        
        console.log(`File uploaded successfully to ${data.Location}`);
        return res.status(httpStatus.OK).json({ 
            message: 'file uploaded  successfully.', 
            imagePath: data.Location, 
            fileName: file.originalname 
        })

    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
}

// Create new NFT
const createNft = async (req, res) => {
    try {
        const {
            name,
            description,
            collectionId,
            attributes,
            nftImage,
            fileName
        } = req?.body || {}

        // Verify collection exists
        const isCollection = await Collection.findById(collectionId)
        if (!isCollection) return res.status(httpStatus.NOT_FOUND).json({ message: 'collection not found' })

        // Check if NFT name exists in collection
        const nftNameCheck = await Nft.find({ collectionId: collectionId, name: name })
        if (nftNameCheck.length > 0) return res.status(httpStatus.CONFLICT).json({ message: "nft name already exist" })

        // Generate file path and move image to S3
        const filePath = await getFilePath(isCollection.name, 'collections', 'nft_images', null)
        if (!filePath.status) return res.status(httpStatus.NOT_ACCEPTABLE).json({ message: filePath.message })
        const finalFilePath = filePath.filePath + '/' + fileName
        await moveObjectS3(nftImage, finalFilePath)

        // Create NFT record
        const result = await new Nft({
            name: name,
            nftImage: 'https://' + config.s3.bucket + '.s3.amazonaws.com/' + finalFilePath,
            description: description,
            collectionId: collectionId,
            attributes: attributes,
            price: 0,
        })
        const nft = await result.save()
        
        return res.status(httpStatus.OK).json({ message: 'nft created successfully.', data: nft })

    } catch (error) {
        console.log(error);
    }
}

// Get fixed price NFT listings for artist
const myFixedSellNftList = async (req, res) => {
    try {
        // Verify artist user
        const user = req.claims;
        const userData = await User.findOne({ _id: user.userId });
        if (!userData) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }

        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const first = parseInt(req.query.perPage) || 10;
        const skip = (page - 1) * first;

        // Get NFT listings from blockchain
        const response = await axios.post(config.SUBGRAPH_API, nftsListedForFixSale(userData.walletAddress, first, skip));
        const nftListFromSubgraph = response.data?.data?.nftlistedForSales || []
        const total = nftListFromSubgraph[0]?.totalTokens || 0
        const lastPage = Math.ceil(nftListFromSubgraph[0]?.totalTokens / first) || 0

        // Group NFTs by collection
        const nftContractTokenMap = new Map();
        nftListFromSubgraph.forEach(item => {
            if (!nftContractTokenMap.has(item.nftContract)) {
                nftContractTokenMap.set(item.nftContract, []);
            }
            nftContractTokenMap.get(item.nftContract).push(item);
        });

        // Get collection data
        const collectionAddresses = Array.from(nftContractTokenMap.keys());
        const collectionData = await Collection.find({ collectionAddress: { $in: collectionAddresses } }).select('_id collectionAddress');
        const collectionIdToNftMap = new Map();

        await Promise.all(
            collectionData.map(({ _id, collectionAddress }) => {
                const nftIds = nftContractTokenMap.get(collectionAddress).map(item => item.tokenId);
                collectionIdToNftMap.set(_id, nftIds);
            })
        );

        // Get NFT data
        const collectionIds = Array.from(collectionIdToNftMap.keys());
        const nftData = await Nft.find({
            collectionId: { $in: collectionIds },
            nftId: { $in: collectionIds.map(id => collectionIdToNftMap.get(id)).flat() }
        }).lean();

        // Get artist usernames
        const artistWalletAddresses = nftListFromSubgraph.map(item => item.artist);
        const artistUsernamesMap = new Map();
        const artistUsers = await User.find({ walletAddress: { $in: artistWalletAddresses } }).select('walletAddress username');
        artistUsers.forEach(user => {
            artistUsernamesMap.set(user.walletAddress, user.username);
        });

        // Combine all data
        const combinedData = nftListFromSubgraph.map(item => {
            const collectionId = collectionData.find(c => c.collectionAddress === item.nftContract)._id;
            const nftInfo = nftData.find(n => n.collectionId.toString() === collectionId.toString() && n.nftId === parseInt(item.tokenId));
            const username = artistUsernamesMap.get(item.artist);

            if (nftInfo) {
                return {
                    ...nftInfo,
                    _id: nftInfo._id.toString(),
                    ...item,
                    owner: username,
                };
            }

            return item;
        });

        return res.status(httpStatus.OK).json({ nftData: combinedData,lastPage,total });

    } catch (error) {
        console.error(error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
}

// Get fixed price NFT bid list
const fixedNftUserBidList = async (req, res) => {
    try {
        // Verify artist user
        const user = req.claims;
        const userData = await User.findOne({ _id: user.userId });
        if (!userData) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }

        const { fixedSaleIndex } = req.query || {}

        // Get bid offers from blockchain
        const response = await axios.post(config.SUBGRAPH_API, getFixlistedOffers(fixedSaleIndex));
        const nftFixedBidOffers = response.data?.data?.nftofferMadeOnFixedSales || []

        // Get usernames for bidders
        const walletToUsernameMap = new Map();
        const walletAddresses = nftFixedBidOffers.map(item => item.offerer);
        const collectionData = await User.find({ walletAddress: { $in: walletAddresses } }).select('username walletAddress').lean();

        collectionData.forEach(user => {
            walletToUsernameMap.set(user.walletAddress, user.username);
        });

        // Add usernames to bid data
        nftFixedBidOffers.forEach(element => {
            const username = walletToUsernameMap.get(element.offerer);
            element.username = username || 'unknown';
        });

        return res.status(httpStatus.OK).json({ nftFixedBidOffers: nftFixedBidOffers });

    } catch (error) {
        console.error(error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
}

// Get auction NFT bid list
const myAuctionBidList = async (req, res) => {
    try {
        // Verify artist user
        const user = req.claims;
        const userData = await User.findOne({ _id: user.userId });
        if (!userData) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }

        const { auctionIndex } = req.query || {}

        // Get auction bids from blockchain
        const response = await axios.post(config.SUBGRAPH_API, getAuctionsOfferInfo(auctionIndex));
        const nftAuctionBidOffers = response.data?.data?.nftbidPlaceds || []

        // Get usernames for bidders
        const walletToUsernameMap = new Map();
        const walletAddresses = nftAuctionBidOffers.map(item => item.bidder);
        const collectionData = await User.find({ walletAddress: { $in: walletAddresses } }).select('username walletAddress').lean();

        collectionData.forEach(user => {
            walletToUsernameMap.set(user.walletAddress, user.username);
        });

        // Add usernames to bid data
        nftAuctionBidOffers.forEach(element => {
            const username = walletToUsernameMap.get(element.bidder);
            element.username = username || 'unknown';
        });

        return res.status(httpStatus.OK).json({ nftAuctionBidOffers: nftAuctionBidOffers });

    } catch (error) {
        console.error(error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
}

// Get NFT offers list
const myOffersBidList = async (req, res) => {
    try {
        // Verify artist user
        const user = req.claims;
        const userData = await User.findOne({ _id: user.userId });
        if (!userData) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }

        const { collectionAddress, tokenID } = req.query || {}

        // Get offers from blockchain
        const response = await axios.post(config.SUBGRAPH_API, getOffersBYcontrcatAddressAndTokenId(collectionAddress, tokenID));
        const offerListFromSubgraph = response.data?.data?.offerMadeForNonListedNFTs || []
        console.log(offerListFromSubgraph)

        // Add usernames to offer data
        for (const item of offerListFromSubgraph) {
            const userData = await User.findOne({ walletAddress: item.offerer }).select('username walletAddress').lean();
            item.username = userData ? userData.username : 'unknown';
        }

        return res.status(httpStatus.OK).json({ nftData: offerListFromSubgraph });

    } catch (error) {
        console.error(error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }

}

const myAuctionSellNftList = async (req, res) => {
    try {
        const user = req.claims;
        const userData = await User.findOne({ _id: user.userId });

        if (!userData) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized user' });
        }
        const page = parseInt(req.query.page) || 1;
        const first = parseInt(req.query.perPage) || 10;
        const skip = (page - 1) * first;

        const response = await axios.post(config.SUBGRAPH_API, auctionList(userData.walletAddress, first, skip));
        const nftListFromSubgraph = response.data?.data.nftlistedForAuctions || [];

        // Create a map to group nftContracts by tokenId
        const nftContractTokenMap = new Map();
        nftListFromSubgraph.forEach(item => {
            if (!nftContractTokenMap.has(item.nftContract)) {
                nftContractTokenMap.set(item.nftContract, []);
            }
            nftContractTokenMap.get(item.nftContract).push(item);
            item.currentHighestBid = item.NFTBidPlaced[0]?.amount || 0;
            item.lastBidSubmitted = item.NFTBidPlaced[0]?.blockTimestamp || 0;
            item.forecastAuctionEnd = item.endTime;
            item.price = item.startPrice;
            delete item.NFTBidPlaced;
            delete item.endTime;
        });

        const collectionAddresses = Array.from(nftContractTokenMap.keys());
        const collectionData = await Collection.find({ collectionAddress: { $in: collectionAddresses } }).select('_id collectionAddress');
        const collectionIdToNftMap = new Map();

        await Promise.all(
            collectionData.map(({ _id, collectionAddress }) => {
                const nftIds = nftContractTokenMap.get(collectionAddress).map(item => item.tokenId);
                collectionIdToNftMap.set(_id, nftIds);
            })
        );

        const collectionIds = Array.from(collectionIdToNftMap.keys());

        const nftData = await Nft.find({
            collectionId: { $in: collectionIds },
            nftId: { $in: collectionIds.map(id => collectionIdToNftMap.get(id)).flat() }
        }).lean();

        // Fetch all artist usernames in one query
        const artistWalletAddresses = nftListFromSubgraph.map(item => item.artist);
        const artistUsernamesMap = new Map();

        const artistUsers = await User.find({ walletAddress: { $in: artistWalletAddresses } }).select('walletAddress username');
        artistUsers.forEach(user => {
            artistUsernamesMap.set(user.walletAddress, user.username);
        });

        // Combine nftData with nftContractTokenMap and artist usernames
        const combinedData = nftListFromSubgraph.map(item => {
            const collectionId = collectionData.find(c => c.collectionAddress === item.nftContract)._id;
            const nftInfo = nftData.find(n => n.collectionId.toString() === collectionId.toString() && n.nftId === parseInt(item.tokenId));
            const username = artistUsernamesMap.get(item.artist);

            if (nftInfo) {
                return {
                    ...nftInfo,
                    _id: nftInfo._id.toString(),
                    ...item,
                    username,
                };
            }

            return item;
        });

        return res.status(httpStatus.OK).json({ nftData: combinedData });
    } catch (error) {
        console.error(error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
};



const myOffersSellNftList = async (req, res) => {
    try {
        const user = req.claims;
        const userData = await User.findOne({ _id: user.userId });
        if (!userData) {
            // If the user is not found, send an error response
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }
        const page = parseInt(req.query.page) || 1;
        const first = parseInt(req.query.perPage) || 10;
        const skip = (page - 1) * first;
        const response = await axios.post(config.SUBGRAPH_API, getOffersByWalletAddress(userData.walletAddress,first,skip));


        const nftListFromSubgraph = response.data?.data?.owners[0]?.tokens || []



        // Use a for...of loop with async/await
        for (const item of nftListFromSubgraph) {

            const collectionData = await Collection.findOne({ collectionAddress: item.collection.id }).select('_id name collectionIncId collectionAddress');

            const nftInfo = await Nft.findOne({ collectionId: collectionData._id, nftId: item.tokenID }).select('nftImage name mintedCreatedDate').lean();
            item.nftImage = nftInfo.nftImage;
            item.nftName = nftInfo.name;
            item.collectionName = collectionData.name;
            item.collectionId = collectionData.collectionIncId;
            item.mintedCreatedDate = nftInfo.mintedCreatedDate;
            item.username = userData.username;

            delete item.OfferMadeForNonListedNFTs
        }
        return res.status(httpStatus.OK).json({ nftData: nftListFromSubgraph || [] });
    } catch (error) {
        console.error(error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
}

const myOwnNft = async (req, res) => {
    try {
        const user = req.claims;
        const userData = await User.findOne({ _id: user.userId });
        if (!userData) {
            // If the user is not found, send an error response
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }

        const page = parseInt(req.query.page) || 1;
        const first = parseInt(req.query.perPage) || 3;
        const skip = (page - 1) * first;
        const walletAddress = userData.walletAddress.toLowerCase();

        const response = await axios.post(config.SUBGRAPH_API, getTokenByWalletAddress(walletAddress, first, skip));
        const myPortfolio = response.data.data?.owners[0]?.tokens || [];

        
        // Use Promise.all to execute all updates concurrently
        let nftData = [];

        await Promise.all(
            myPortfolio.map(async ({ tokenID, collection }) => {
                const aggregationPipeline = [
                    {
                        $match: { collectionAddress: collection.id }, // Match the collection by collectionAddress
                    },
                    {
                        $lookup: {
                            from: 'nfts', // The name of the NFT collection
                            localField: '_id',
                            foreignField: 'collectionId',
                            as: 'nfts',
                        },
                    },
                    {
                        $project: {
                            collectionAddress: 1,
                            nftData: {
                                $filter: {
                                    input: '$nfts',
                                    as: 'nft',
                                    cond: { $eq: ['$$nft.nftId', parseInt(tokenID)] },
                                },
                            },
                        },
                    },
                ];

                const collectionResult = await Collection.aggregate(aggregationPipeline);
                const { collectionAddress, nftData: filteredNftData } = collectionResult[0];

                if (filteredNftData.length > 0) {
                    nftData.push({ ...filteredNftData[0], collectionAddress }, // Assuming you want to include the first matching NFT data
                    );
                }
            })
        );
        return res.status(httpStatus.OK).json({ nftData, owner: userData.username });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
};

const allNftBidList = async (req, res) => {
    try {

        const user = req.claims;
        const userData = await User.findOne({ _id: user.userId });
        if (!userData) {
            // If the user is not found, send an error response
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }


        // Static data for ACTIVITY, COLLECTION, and DATE
        // Static data for ACTIVITY, COLLECTION, and DATE
        const staticData = [
            { nftId: 1, nftImage: 'https://intranafordeveloper.s3.amazonaws.com/uploads/collections/bored_ape/chupa%20replace%20bored%20ape.png', mintedDate: '2023-10 - 19', traits: 'Fearsome, Clawai', owner: 'username', rarity: 'common', value: 0.7, listed: '3 days 4Hrs 39 Sec', highestBid: '1.67', lastBidTime: '1 Hrs ago', forecastAuctionEnd: '2 Days 13 Hrs 40 Sec' },
            { nftId: 2, nftImage: 'https://intranafordeveloper.s3.amazonaws.com/uploads/collections/bored_ape/chupa%20replace%20bored%20ape.png', mintedDate: '2023-09-15', traits: 'Fearsome, Clawaias', owner: 'username', rarity: 'common', value: 0.8, listed: '3 days 4Hrs 39 Sec', highestBid: '1.67', lastBidTime: '1 Hrs ago', forecastAuctionEnd: '2 Days 13 Hrs 40 Sec' },
            { nftId: 3, nftImage: 'https://intranafordeveloper.s3.amazonaws.com/uploads/collections/bored_ape/chupa%20replace%20bored%20ape.png', mintedDate: '2022-09-23', traits: 'Fearsome, Clawaiccc', owner: 'username', rarity: 'common', value: 0.0089, listed: '3 days 4Hrs 39 Sec', highestBid: '1.67', lastBidTime: '1 Hrs ago', forecastAuctionEnd: '2 Days 13 Hrs 40 Sec' },
            { nftId: 4, nftImage: 'https://intranafordeveloper.s3.amazonaws.com/uploads/collections/bored_ape/chupa%20replace%20bored%20ape.png', mintedDate: '2022-09-23', traits: 'Fearsome, Clawaiccc', owner: 'username', rarity: 'common', value: 0.0089, listed: '3 days 4Hrs 39 Sec', highestBid: '1.67', lastBidTime: '1 Hrs ago', forecastAuctionEnd: '2 Days 13 Hrs 40 Sec' },

        ];

        // Create an object with the key "collectinData" and assign the staticData array to it
        const responseObj = { nftBidData: staticData };

        // json response
        res.status(httpStatus.OK).json(responseObj);




    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
}


const myNftBidList = async (req, res) => {
    try {

        const user = req.claims;
        const userData = await User.findOne({ _id: user.userId });
        if (!userData) {
            // If the user is not found, send an error response
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }


        // Static data for ACTIVITY, COLLECTION, and DATE
        const staticData = [
            { nftId: 1, nftImage: 'https://intranafordeveloper.s3.amazonaws.com/uploads/collections/bored_ape/chupa%20replace%20bored%20ape.png', mintedDate: '2023-10-19', traits: 'Fearsome,d Clawai', owner: 'username', rarity: 'common', value: 0.27, sent: '3 days 4Hrs 39 Sec', amount: '1.67', remainingTimeToExpire: '1 Hrs ago', status: 'pending' },
            { nftId: 2, nftImage: 'https://intranafordeveloper.s3.amazonaws.com/uploads/collections/bored_ape/chupa%20replace%20bored%20ape.png', mintedDate: '2023-08-15', traits: 'Fearsome, Clawaias', owner: 'username', rarity: 'common', value: 0.8, sent: '3 days 4Hrs 39 Sec', amount: '1.67', remainingTimeToExpire: '1 Hrs ago', status: 'success' },
            { nftId: 3, nftImage: 'https://intranafordeveloper.s3.amazonaws.com/uploads/collections/bored_ape/chupa%20replace%20bored%20ape.png', mintedDate: '2022-03-23', traits: 'Fearsomsdfe, Clawaiccc', owner: 'username', rarity: 'common', value: 0.0089, sent: '3 days 4Hrs 39 Sec', amount: '1.67', remainingTimeToExpire: '1 Hrs ago', status: 'success' },
            { nftId: 4, nftImage: 'https://intranafordeveloper.s3.amazonaws.com/uploads/collections/bored_ape/chupa%20replace%20bored%20ape.png', mintedDate: '2022-01-12', traits: 'Fearsomes, Clawaiccc', owner: 'username', rarity: 'common', value: 0.0089, sent: '3 days 4Hrs 39 Sec', amount: '1.67', remainingTimeToExpire: '1 Hrs ago', status: 'pending' },

        ];

        // Create an object with the key "collectinData" and assign the staticData array to it
        const responseObj = { myOwnNfts: staticData };

        // json response
        res.status(httpStatus.OK).json(responseObj);




    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
}



module.exports = {
    createCollection,
    login,
    registerArtist,
    myNftBidList,
    myFixedSellNftList,
    allNftBidList,
    createNft,
    myOwnNft,
    uploadImage,
    updateIsLaunchCollection,
    updateIsLaunchCollectionForApi,
    updateMintedNft,
    updateMintedNftForApi,
    myAuctionSellNftList,
    myOffersSellNftList,
    fixedNftUserBidList,
    myAuctionBidList,
    myOffersBidList
}