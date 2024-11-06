// Import configuration settings
const config = require('../config/config');

// Import database models
const { User, Collection, Nft } = require('../models');

// Import core Node.js crypto for token generation
const crypto = require('crypto');

// Import password hashing library
const bcrypt = require('bcrypt');

// Import JWT for authentication tokens
const jwt = require('jsonwebtoken');

// Import HTTP status codes
const httpStatus = require('http-status');

// Import 2FA libraries
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Import MongoDB ODM
const { default: mongoose } = require('mongoose');

// Import email service
const sendVerificationEmail = require('./email.service');

// Import HTTP client
const { default: axios } = require('axios');

// Import blockchain query functions
const {
    contractAddressWiseCollectionInfo,
    getCollectionInfoByContarct,
    allNftsListedForFixSale,
    auctionInfoByIndexId,
    AllauctionList,
    getMySendBidsForFix,
    getAuctionByWalletAddress
} = require('../subGraphQuery/collection/getCollectionIndex');

// Import socket.io manager
const { getIo } = require('../socketManager');

// Import artist service functions
const { updateMintedNft } = require('./artist.service');

// Generate a verification token
const generateVerificationToken = () => {
    const token = crypto.randomBytes(32).toString('hex');
    const timestamp = new Date();
    return { token, timestamp };
};

//Register user
const register = async function (req, res) {
    const { firstName, surname, email, username, password, walletAddress } = req.body || {};
    // Generate a verification token and timestamp
    const { token, timestamp } = generateVerificationToken();
    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds
    try {
        // Create a new user with the verification token
        const user = new User({
            firstName,
            surname,
            email,
            username,
            password: hashedPassword,
            verificationToken: token,
            verificationTokenTimestamp: timestamp,
            roleId: 3,
            walletAddress: walletAddress?.toLowerCase()
        });
        const secret = speakeasy.generateSecret({ name: user.username, options: { encoding: 'base32' } });
        user.MFASecret = secret.base32;
        // Save the user to the database
        await user.save();

        // Send the verification email with the token (see next step)
        await sendVerificationEmail(email, token, user._id.toString(), user.roleId)

        return res.status(httpStatus.OK).json({ message: 'Registration successful.', userId: user._id });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Registration failed.' });
    }
}


const login = async (req, res) => {
    try {
        const io = getIo()
        const { username, password } = req.body; // Assuming email or username is sent in the request body

        // Find user by email or username
        const user = await User.findOne({ $or: [{ email: username }, { username: username }] });

        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ error: 'Invalid credentials' });
        }

        // Check if the provided password matches the hashed password in the database
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(httpStatus.NOT_FOUND).json({ error: 'Invalid credentials' });
        }

        if (!user.is2FAEnabled) {
            const secret = speakeasy.generateSecret({ name: user.username, options: { encoding: 'base32' } });
            user.MFASecret = secret.base32;
        }
        user.socketId = io.socketId
        await user.save();
        // Send the token back to the client 
        return res.status(httpStatus.OK).json({ message: 'login success.', userId: user._id, isKyc: user.isKyc, isEmail: user.isVerified, is2FAEnabled: user.is2FAEnabled });
    } catch (error) {
        // Handle errors, for example, database errors
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
};

//check email exist or not
const checkEmailExist = async (req, res) => {
    const { email } = req.body
    try {
        const result = await User.findOne({ email })
        if (result)
            return res.status(httpStatus.OK).json({ isExist: true })
        else
            return res.status(httpStatus.OK).json({ isExist: false })

    } catch (error) {
        console.log(error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isExist: false, message: error })
    }
}
//check email exist or not
const checkUserNameExist = async (req, res) => {
    const { username } = req.body
    try {
        const result = await User.findOne({ username })
        if (result)
            return res.status(httpStatus.OK).json({ isExist: true })
        else
            return res.status(httpStatus.OK).json({ isExist: false })

    } catch (error) {
        console.log(error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isExist: false, message: error })
    }
}

const resendEmail = async (req, res) => {
    const { userId } = req.params || {}
    try {
        const user = await User.findById(userId)
        if (!user) return res.status(httpStatus.NOT_FOUND).json({ message: 'user not found' })
        const { token, timestamp } = generateVerificationToken();
        user.verificationToken = token
        user.verificationTokenTimestamp = timestamp
        await user.save()
        await sendVerificationEmail(user.email, user.verificationToken, userId, user.roleId)
        return res.status(httpStatus.OK).json({ message: "verification link sent." })
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error })
    }
}
const verifyKyc = async (req, res) => {
    const { userId } = req.params || {}
    try {
        const user = await User.findById(userId)
        if (!user) return res.status(httpStatus.NOT_FOUND).json({ message: 'user not found' })
        user.isKyc = true
        await user.save()
        return res.status(httpStatus.OK).json({ message: "kyc verification done." })
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error })
    }
}

//verify email 
const verifyEmail = async (req, res) => {
    const { token, userId } = req.query;
    try {
        // Find the user with the provided verification token and email
        const userInfo = await User.findById(userId);
        if (userInfo.isVerified) return res.status(httpStatus.OK).json({ message: 'already verified', isEmailVarified: true });
        const user = await User.findOne({ verificationToken: token, email: userInfo.email });
        if (!user) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: 'Invalid token or email', isEmailVarified: false });
        }
        // Check if the token has expired (24 hours limit)
        const timestamp = new Date(user.verificationTokenTimestamp).getTime()
        const currentTime = new Date().getTime();
        // const expirationTime = new Date(timestamp + 10 * 1000).getTime();// Add 30 sec in milliseconds
        const expirationTime = new Date(timestamp + 24 * 60 * 60 * 1000); // Add 24 hours in milliseconds

        if (currentTime > expirationTime) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: 'Verification link has expired', isEmailVarified: false });
        }

        // Mark the user as verified and clear the verification token
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenTimestamp = undefined;
        await user.save();

        return res.status(httpStatus.OK).json({ message: 'Email verified successfully', isEmailVarified: true });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Server error' });
    }
}


const generateQr = async (req, res) => {
    try {
        const { userId } = req?.query;

        if (!userId) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const user = await User.findById(userId);

        if (!user || !user.MFASecret) {
            return res.status(400).json({ message: 'user not found.' });
        }
        if (!user.MFASecret) {
            return res.status(400).json({ message: 'you dont have mfa secret' });
        }
        // const secret = speakeasy.generateSecret({ name: 'Intrana', options: { encoding: 'base32' } });
        const url = speakeasy.otpauthURL({ secret: user.MFASecret, encoding: 'base32', label: `INTRANA:${userId}`, issuer: 'Intrana' });
        const qrImage = await QRCode.toDataURL(url);
        return res.status(httpStatus.OK).json({ qrCode: qrImage });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}



const verifyTokenMFA = async (req, res) => {
    try {
        const { secret, userId } = req?.query;
        if (!userId || !secret) {
            return res.status(400).send('Invalid request.');
        }

        const user = await User.findById(userId);

        if (!user || !user.MFASecret) {
            return res.status(400).json({ message: 'MFA secret not found for the user.' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.MFASecret,
            encoding: 'base32',
            token: secret,
            window: 1
        });
        // Password matches, generate a JWT token with the user ID as the payload
        const token = jwt.sign({ userId: user._id }, config.JWT_TOKEN_SECRET, {
            expiresIn: '24h' // Token expiration time, you can adjust this as needed
        });

        if (verified) {
            user.is2FAEnabled = true
            await user.save()
            return res.status(httpStatus.OK).json({ message: 'login success.', user: { walletAddress: user.walletAddress, firstName: user.firstName, username: user.username, email: user.email, surname: user.surname, id: user._id }, token });
        } else {
            return res.status(httpStatus.NOT_FOUND).json({ message: 'Invalid verification code.' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json(error);
    }
};

const testApi = async (req, res) => {
    try {
        const collectionIds = ['654de65b4da847116f8c5f82', '654de7fd4da847116f8c5fb7']

        //this result is find nfts data using collectionIds
        const result = await Collection.aggregate([
            {
                $match: {
                    _id: { $in: collectionIds.map(id => new mongoose.Types.ObjectId(id)) },
                    isLaunch: true
                }
            },
            {
                $lookup: {
                    from: 'nfts', // Assuming 'nfts' is the name of the NFT model's collection
                    localField: '_id',
                    foreignField: 'collectionId',
                    as: 'nftsa'
                }
            },
            {
                $addFields: {
                    nftsa: {
                        $filter: {
                            input: "$nftsa",
                            as: "nft",
                            cond: {
                                $and: [
                                    { $eq: ["$$nft.isMinted", false] },//eq will be use for equal to
                                    { $gte: ["$$nft.price", 0] } // Add the new condition for price >= 0
                                ]
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    totalNFTs: { $size: "$nftsa" }, // Add the total number of NFTs
                    totalPrices: { $sum: "$nftsa.price" } // Add the sum of prices for all NFTs
                }
            }
        ]);

        // //find collection records using nftId
        // const nftIds = ['654e13aa53a5583b496d904d', '6555c31f53a5583b496d9ccd']

        // const nftData = await Nft.find({ _id: { $in: nftIds } }).populate({
        //     path: 'collectionId',
        //     model: 'Collection', // Use the correct case
        //     select: 'name collectionImage',
        // });

        res.status(200).send(result)

    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
};
const hotCollections = async (req, res) => {
    try {


        // Admin with roleId 1 can see all collection data
        const collectionData = await Collection.find({
            isLaunch: 1 // Add the condition to filter documents where isLaunch is equal to 1
        }).select({
            '_id': 0, // Exclude the original _id field
            'collectionImage': 1,
            'name': 1,
            'description': 1,
            'createdAt': 1,
            'isLaunch': 1,
            'collectionAddress': 1,
            'collectionIncId': 1,
            'collectionId': '$_id' // Create a new field with the name "collectionId"
        }).limit(10);


        // Use map to add 'floorPrice' to each object with a static value of 3
        const modifiedCollectionData = collectionData.map(item => ({
            ...item.toObject(),
            floorPrice: 0.5,
            minted: 100,
            unminted: 200,
            volume: 200,
            lastSevenDays: `1598 +10%`,
        }));


        // json response
        res.status(httpStatus.OK).json({
            collectionData: modifiedCollectionData,
        });
    } catch (error) {
        // Handle errors, for example, database errors
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
}

const userViewCollection = async (req, res) => {
    try {
        const { collectionId } = req.query
        const page = parseInt(req.query.page) || 1;
        const first = parseInt(req.query.perPage) || 3;
        const skip = (page - 1) * first;
        const aggregationPipeline = [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(collectionId),
                }, // Match the collection by _id
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
                    _id: 1,
                    name: 1,
                    collectionImage: 1,
                    description: 1,
                    collectionAddress: 1,
                    isLaunch: 1,
                    createdAt: 1,
                    nftCount: { $size: '$nfts' },
                    floorPrice: {
                        $min: {
                            $map: {
                                input: '$nfts',
                                as: 'nft',
                                in: '$$nft.price',
                            },
                        },
                    },
                },
            },
        ];
        var collection = await Collection.aggregate(aggregationPipeline);
        var collection = collection[0]
        // Now, the 'collection' variable will contain the collection information
        // along with the total NFT count in the 'nftCount' field.
        if (!collection) {
            return res.status(httpStatus.NOT_FOUND).json({ error: 'Collection Not Found' });
        }

        if (collection.collectionAddress) {
            var collectionInfoSubgraph = await axios.post(config.SUBGRAPH_API, contractAddressWiseCollectionInfo(collection.collectionAddress))
            var collectionData = await axios.post(config.SUBGRAPH_API, getCollectionInfoByContarct(collection.collectionAddress, first, skip))
            await updateMintedNft(collection.collectionAddress)

        }

        return res.status(httpStatus.OK).json({
            collectionId: collection._id,
            collectionAddress: collection.collectionAddress,
            collectionName: collection.name,
            collectionImage: collection.collectionImage,
            description: collection.description,
            isLaunch: collection.isLaunch,
            createdAt: collection.createdAt,
            floorPrice: collectionData.data.data.collections[0]?.floorPrice || 0,
            uniqueOwner: collectionData.data.data.collections[0]?.ownerCount || 0,
            totalNft: collection.nftCount,
            minthedNft: collectionInfoSubgraph?.data?.data?.collections[0]?.totalTokens || 0,
            ownerCount: collectionInfoSubgraph?.data?.data?.collections[0]?.ownerCount || 1,
        });


    } catch (error) {
        // Handle errors, for example, database errors
        console.error(error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }

}


const nftListByCollectionId = async (req, res) => {
    try {
        const collectionId = req.query.collectionId;
        // Find the collection based on collectionIncId
        const collection = await Collection.findOne({ _id: new mongoose.Types.ObjectId(collectionId) });
        if (!collection) {
            return res.status(httpStatus.NOT_FOUND).json({ data: null });
        }
        const page = parseInt(req.query.page) || 1;
        const first = parseInt(req.query.perPage) || 3;
        const skip = (page - 1) * first;
        var collectionData = await axios.post(config.SUBGRAPH_API, getCollectionInfoByContarct(collection.collectionAddress, first, skip))
        const nftIds = collectionData.data.data.collections[0]?.tokens.map(item => item.tokenID) || []

        const nftInfo = await Nft.find({ collectionId: collection._id, nftId: { $in: nftIds } }).lean();

        // Fetch all user data in a single query
        const ownerIds = collectionData.data.data.collections[0].tokens.map(item => item.owner.id);
        const users = await User.find({ walletAddress: { $in: ownerIds } });

        // Loop through $b.collections[0].tokens and add image from $a
        for (const nft of collectionData.data.data.collections[0].tokens) {
            const matchingItem = nftInfo.find(item => item.nftId == nft.tokenID);
            if (matchingItem) {
                nft.nftImage = matchingItem.nftImage
                nft.name = matchingItem.name
                nft.mintedCreatedDate = matchingItem.mintedCreatedDate

                const user = users.find(u => u.walletAddress === nft.owner.id);
                if (user) {
                    nft.username = user.username;
                } else {
                    nft.username = 'unknown';
                }

                nft.walletAddress = nft.owner.id;
            }
        }
        res.status(httpStatus.OK).json({
            nftData: collectionData.data.data.collections[0]?.tokens || []
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
}

const allFixedSellNftList = async (req, res) => {
    try {
        const user = req.claims;
        const userData = await User.findOne({ _id: user.userId });

        if (!userData) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized user' });
        }
        const page = parseInt(req.query.page) || 1;
        const first = parseInt(req.query.perPage) || 3;
        const skip = (page - 1) * first;
        const response = await axios.post(config.SUBGRAPH_API, allNftsListedForFixSale(first, skip));
        const nftListFromSubgraph = response.data?.data?.nftlistedForSales || [];

        // Create a map to group nftContracts by tokenId
        const nftContractTokenMap = new Map();

        const artistWalletAddresses = Array.from(new Set(nftListFromSubgraph.map(item => item.artist))); // Collect artist wallet addresses

        // Fetch user information for all artist wallet addresses in one query
        const artistUserMap = new Map();
        const artistUsers = await User.find({ walletAddress: { $in: artistWalletAddresses } });

        artistUsers.forEach(userInfo => {
            artistUserMap.set(userInfo.walletAddress, userInfo.username);
        });
        nftListFromSubgraph.forEach(item => {
            if (!nftContractTokenMap.has(item.nftContract)) {
                nftContractTokenMap.set(item.nftContract, []);
            }
            nftContractTokenMap.get(item.nftContract).push(item);
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

        // Combine nftData with nftContractTokenMap and artist usernames
        const combinedData = nftListFromSubgraph.map(item => {
            const collectionId = collectionData.find(c => c.collectionAddress === item.nftContract)._id;
            const nftInfo = nftData.find(n => n.collectionId.toString() === collectionId.toString() && n.nftId === parseInt(item.tokenId));
            const username = artistUserMap.get(item.artist);

            if (nftInfo) {
                return {
                    ...nftInfo,
                    _id: nftInfo._id.toString(),
                    owner: userData.username,
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


const allMyBidFixedNftList = async (req, res) => {

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
        const response = await axios.post(config.SUBGRAPH_API, getMySendBidsForFix(userData.walletAddress, first, skip));

        const nftListFromSubgraph = response.data?.data?.nftofferMadeOnFixedSales || []

        // Use a for...of loop with async/await
        for (const item of nftListFromSubgraph) {

            const collectionData = await Collection.findOne({ collectionAddress: item.NFTListedForSale.nftContract }).select('_id name collectionIncId collectionAddress');

            const nftInfo = await Nft.findOne({ collectionId: collectionData._id, nftId: item.NFTListedForSale.tokenId }).select('nftImage name mintedCreatedDate').lean();
            item.nftImage = nftInfo.nftImage;
            item.nftName = nftInfo.name;
            item.collectionName = collectionData.name;
            item.collectionId = collectionData.collectionIncId;
            item.mintedCreatedDate = nftInfo.mintedCreatedDate;
            item.price = item.NFTListedForSale.price;

            const userData = await User.findOne({ walletAddress: item.NFTListedForSale.artist }).select('username walletAddress').lean();
            if (userData) {
                item.username = userData.username;
            }
            else {
                item.username = 'unknown';
            }
            delete item.NFTListedForSale;


        }

        return res.status(httpStatus.OK).json({ nftData: nftListFromSubgraph || [] });





    } catch (error) {
        console.error(error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
}


const allMyBidAuctionNftList = async (req, res) => {

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
        const response = await axios.post(config.SUBGRAPH_API, getAuctionByWalletAddress(userData.walletAddress, first, skip));

        const nftListFromSubgraph = response.data?.data?.nftbidPlaceds || []


        // Use a for...of loop with async/await
        for (const item of nftListFromSubgraph) {

            const collectionData = await Collection.findOne({ collectionAddress: item.NFTListedForAuction.nftContract }).select('_id name collectionIncId collectionAddress');

            const nftInfo = await Nft.findOne({ collectionId: collectionData._id, nftId: item.NFTListedForAuction.tokenId }).select('nftImage name mintedCreatedDate').lean();
            item.nftImage = nftInfo.nftImage;
            item.nftName = nftInfo.name;
            item.collectionName = collectionData.name;
            item.collectionId = collectionData.collectionIncId;
            item.mintedCreatedDate = nftInfo.mintedCreatedDate;
            item.price = item.NFTListedForAuction.startPrice;
            item.offer = item.amount;


            // const userData = await User.findOne({ walletAddress: item.NFTListedForAuction.artist }).select('username walletAddress').lean();
            // if (userData) {
            //     item.username = userData.username;
            // }
            // else {
            //     item.username = 'unknown';
            // }
            item.username = 'maket place';
            delete item.NFTListedForAuction;


        }

        return res.status(httpStatus.OK).json({ nftData: nftListFromSubgraph || [] });





    } catch (error) {
        console.error(error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
}


const allAuctionSellNftList = async (req, res) => {
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
        const response = await axios.post(config.SUBGRAPH_API, AllauctionList(first, skip));

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


        // Combine nftData with nftContractTokenMap
        const combinedData = nftListFromSubgraph.map(item => {
            const collectionId = collectionData.find(c => c.collectionAddress === item.nftContract)._id;
            const nftInfo = nftData.find(n => n.collectionId.toString() === collectionId.toString() && n.nftId === parseInt(item.tokenId));
            const username = artistUsernamesMap.get(item.artist);
            if (nftInfo) {
                return {
                    ...nftInfo,
                    _id: nftInfo._id.toString(),
                    ...item,
                    username
                };
            }

            return item;
        });

        return res.status(httpStatus.OK).json({ nftData: combinedData });

    } catch (error) {
        console.error(error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
}
const getAuctionInfo = async (req, res) => {
    try {
        const { auctionIndexId } = req.query
        const user = req.claims;
        const userData = await User.findOne({ _id: user.userId });
        if (!userData) {
            // If the user is not found, send an error response
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }

        const response = await axios.post(config.SUBGRAPH_API, auctionInfoByIndexId(auctionIndexId));

        const auctionNftInfo = response.data?.data?.nftlistedForAuctions || []
        if (auctionNftInfo.length == 0) return res.status(httpStatus.OK).json({ auctionNftInfo });

        const nftData = auctionNftInfo[0]?.NFTBidPlaced;
        auctionNftInfo[0].currentAuctionBid = nftData[0]?.amount || 0;


        const walletAddresses = nftData.map(item => item.bidder)
        const walletToUsernameMap = new Map()
        // Query the User collection for usernames
        const users = await User.find({ walletAddress: { $in: walletAddresses } }).select('username walletAddress').lean();

        // Populate the walletToUsernameMap with the usernames
        users.forEach(user => {
            walletToUsernameMap.set(user.walletAddress, user.username);
        });



        // Update nftFixedBidOffers with usernames
        nftData.forEach(element => {
            const username = walletToUsernameMap.get(element.bidder);
            if (username) {
                element.username = username;
            } else {
                element.username = 'unknown';
            }
        });

        // json response
        res.status(httpStatus.OK).json({
            auctionNftInfo
        });


    } catch (error) {
        // Handle errors, for example, database errors
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
}
const allCollections = async (req, res) => {
    try {

        // Query the "users" table to find users with roleId = 2
        const page = parseInt(req.query.page) || 1; // Get the page number from the query parameters, default to 1 if not provided
        const perPage = parseInt(req.query.perPage) || 10; // Get the perPage value from the query parameters, default to 10 if not provided

        var totalCount = await Collection.countDocuments();
        var totalPages = Math.ceil(totalCount / perPage);
        var lastPage = totalPages;
        const skip = (page - 1) * perPage; // Calculate the number of documents to skip based on the page number and page size

        // Admin with roleId 1 can see all collection data
        const collectionData = await Collection.find({
            isLaunch: 1 // Add the condition to filter documents where isLaunch is equal to 1
        }).select({
            '_id': 0, // Exclude the original _id field
            'collectionImage': 1,
            'name': 1,
            'description': 1,
            'createdAt': 1,
            'isLaunch': 1,
            'collectionAddress': 1,
            'collectionIncId': 1,
            'collectionId': '$_id' // Create a new field with the name "collectionId"
        })
            .sort({ createdAt: -1 }) // Sort transactions by createdAt field in descending order (latest first)
            .skip(skip) // Skip the specified number of documents
            .limit(perPage); // Limit the number of documents returned per page

        // Use map to add 'floorPrice' to each object with a static value of 3
        const modifiedCollectionData = collectionData.map(item => ({
            ...item.toObject(),
            floorPrice: 0.5,
            minted: 100,
            unminted: 200,
            volume: 200,

            lastSevenDays: `1598 +10%`,
        }));


        // json response
        res.status(httpStatus.OK).json({
            collectionData: modifiedCollectionData,
            totalRecords: totalCount,
            totalPages,
            currentPage: page,
            perPage,
            lastPage
        });
    } catch (error) {
        // Handle errors, for example, database errors
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }



}

// Define an async function to handle metadata retrieval
const metadataUri = async (req, res) => {

    try {
        const { collectionId, nftId } = req.params;

        // Find the collection based on collectionIncId
        const collection = await Collection.findOne({ collectionIncId: parseInt(collectionId) });

        if (!collection) {
            return res.status(httpStatus.NOT_FOUND).json({ data: null });
        }

        // Find the NFT within the collection using nftId
        const nftData = await Nft.findOne({ collectionId: collection._id, nftId: parseInt(nftId) });

        if (!nftData) {
            return res.status(httpStatus.NOT_FOUND).json({ data: null });
        }

        // Construct the response data
        const data = {
            tokenId: nftData.nftId,
            name: nftData.name,
            image: nftData.nftImage,
            description: nftData.description,
            attributes: nftData.attributes
        };

        return res.status(httpStatus.OK).json({ data });
    } catch (error) {
        console.error(error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'An error occurred' });
    }
};

module.exports = {
    testApi,
    register,
    verifyEmail,
    checkEmailExist,
    checkUserNameExist,
    login,
    allMyBidAuctionNftList,
    generateQr,
    verifyTokenMFA,
    hotCollections,
    allCollections,
    metadataUri,
    allAuctionSellNftList,
    userViewCollection,
    nftListByCollectionId,
    allFixedSellNftList,
    allMyBidFixedNftList,
    getAuctionInfo,
    resendEmail,
    verifyKyc
};