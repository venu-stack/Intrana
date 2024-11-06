// Import required dependencies and configurations
const config = require('../config/config');
const { User, Collection, Nft } = require('../models');
const crypto = require('crypto');
const transporter = require('./email.service');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const { default: mongoose } = require('mongoose');
const nodemailer = require('nodemailer');
const { default: axios } = require('axios');
const path = require('path');
const fs = require('fs');
const { contractAddressWiseCollectionInfo } = require('../subGraphQuery/collection/getCollectionIndex');
const { updateMintedNft } = require('./artist.service');
const { getTokenByWalletAddress } = require('../subGraphQuery/Nft/nftQuery');

// Helper function to generate verification token and timestamp
const generateVerificationToken = () => {
    const token = crypto.randomBytes(32).toString('hex');
    const timestamp = new Date();
    return { token, timestamp };
};

// Admin login handler
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user by email or username with roleId 1 (admin)
        const user = await User.findOne({ $or: [{ email: username }, { username: username }], roleId: 1 });

        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(httpStatus.NOT_FOUND).json({ error: 'Wrong password' });
        }

        // Check if user is verified
        if (!user.isVerified) return res.status(httpStatus.NOT_FOUND).json({ error: 'user not verified' })

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, config.JWT_TOKEN_SECRET, {
            expiresIn: '24h'
        });

        res.status(httpStatus.OK).json({
            message: 'login success.',
            user: {
                firstName: user.firstName,
                username: user.username,
                email: user.email,
                surname: user.surname,
                id: user._id
            },
            token
        });

    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
};

// Update user profile information
const userProfileUpdate = async (req, res) => {
    try {
        const userId = req.claims;
        const { username, firstName, surname } = req.body;

        // Find user by ID
        const userData = await User.findOne({ _id: userId.userId });
        if (!userData) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }

        // Update user fields
        userData.username = username;
        userData.firstName = firstName;
        userData.surname = surname;

        await userData.save();

        return res.status(httpStatus.OK).json({ message: 'User data updated successfully' });

    } catch (error) {
        // Handle duplicate key errors
        if (error.code === 11000) {
            if (error.keyPattern.email) {
                res.status(httpStatus.BAD_REQUEST).json({ message: 'Email already exists' });
            } else if (error.keyPattern.username) {
                res.status(httpStatus.BAD_REQUEST).json({ message: 'Username already exists' });
            } else {
                res.status(httpStatus.BAD_REQUEST).json({ message: 'Duplicate key error' });
            }
        } else {
            console.error(error);
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
        }
    }
}

// Create new artist account
const createArtist = async (req, res) => {
    try {
        const adminId = req.claims;
        const { firstName, surname, email, username, password, walletAddress } = req.body;

        // Verify admin user
        const admin = await User.findOne({ _id: adminId.userId, roleId: 1 });
        if (!admin) {
            return res.status(httpStatus.NOT_FOUND).json({ error: 'Unauthrised user' });
        }

        // Generate verification token and hash password
        const { token, timestamp } = generateVerificationToken();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with artist role (2)
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
            roleId: 2
        });

        await user.save();

        // Send registration email
        var subjectData = "Registration on INTRANA";
        var textData = `you are successfull register as a ARTIST in a INTRANA.\n\n login credentails\n username: ${username}\n password:  ${password} `;

        const sendEmail = await sendingEmail(subjectData, textData, email)
        if (!sendEmail) return res.status(httpStatus.BAD_GATEWAY).json({ error: 'Something wrong with the email gateway' })

        return res.status(httpStatus.OK).json({ message: 'Artist registered successful.' })

    } catch (error) {
        // Handle duplicate key errors
        if (error.code === 11000) {
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

// Update user password
const userUpdatePassword = async (req, res) => {
    try {
        const adminId = req.claims;
        const { oldPassword, newPassword } = req.body;

        // Find and verify user
        const admin = await User.findOne({ _id: adminId.userId });
        if (!admin) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }

        // Verify old password
        const passwordMatch = await bcrypt.compare(oldPassword, admin.password);
        if (!passwordMatch) {
            return res.status(httpStatus.NOT_FOUND).json({ error: 'old password not matched' });
        }

        // Hash and save new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        admin.password = hashedPassword;
        await admin.save();

        return res.status(httpStatus.OK).json({ message: 'Password updated successfully.' });

    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
}

// Create new regular user account
const createUser = async (req, res) => {
    try {
        const adminId = req.claims;
        const { firstName, surname, email, username, walletAddress, password } = req.body;

        // Verify admin user
        const admin = await User.findOne({ _id: adminId.userId, roleId: { $in: [1] } });
        if (!admin) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }

        // Generate verification token and hash password
        const { token, timestamp } = generateVerificationToken();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with regular user role (3)
        const user = new User({
            firstName,
            surname,
            email,
            username,
            walletAddress: walletAddress?.toLowerCase(),
            isVerified: true,
            password: hashedPassword,
            verificationToken: token,
            verificationTokenTimestamp: timestamp,
            roleId: 3
        });

        await user.save();

        return res.status(httpStatus.OK).json({ message: 'User registered successful.' })

    } catch (error) {
        // Handle duplicate key errors
        if (error.code === 11000) {
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

// Get profile information for logged in user
const myProfileInfo = async (req, res) => {
    try {
        const userId = req.claims;

        const user = await User.findOne({ _id: userId.userId });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }

        res.status(httpStatus.OK).json({
            userId: user._id,
            firstName: user.firstName,
            surname: user.surname,
            email: user.email,
            intranaId: user.intranaId,
            username: user.username,
            walletAddress: user.walletAddress
        });
        console.log(user);
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
};

// Get list of all artists
const artistList = async (req, res) => {
    try {
        const adminId = req.claims;
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10;

        // Verify admin user
        const admin = await User.findOne({ _id: adminId.userId, roleId: 1 });
        if (!admin) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }

        // Calculate pagination values
        const totalCount = await User.countDocuments({ roleId: 2 });
        const totalPages = Math.ceil(totalCount / perPage);
        const lastPage = totalPages;
        const skip = (page - 1) * perPage;

        // Get paginated list of artists
        const artistList = await User.find({ roleId: 2 })
            .select('_id firstName surname email username intranaId walletAddress')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(perPage);

        res.status(httpStatus.OK).json({
            artistList,
            totalRecords: totalCount,
            totalPages,
            currentPage: page,
            perPage,
            lastPage
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
};

// Get list of all regular users
const userList = async (req, res) => {
    try {
        const adminId = req.claims;
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 2;

        // Verify admin user
        const admin = await User.findOne({ _id: adminId.userId, roleId: 1 });
        if (!admin) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }

        // Calculate pagination values
        const totalCount = await User.countDocuments({ roleId: 3 });
        const totalPages = Math.ceil(totalCount / perPage);
        const lastPage = totalPages;
        const skip = (page - 1) * perPage;

        // Get paginated list of users
        const userList = await User.find({ roleId: 3 })
            .select('_id firstName surname email username intranaId walletAddress')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(perPage);

        res.status(httpStatus.OK).json({
            userList,
            totalRecords: totalCount,
            totalPages,
            currentPage: page,
            perPage,
            lastPage
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
};

// Get list of collections for a specific artist
const artistOwnCollectionList = async (req, res) => {
    try {
        const adminId = req.claims;
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 2;
        const artistId = req.query.artistId

        // Verify admin user
        const admin = await User.findOne({ _id: adminId.userId, roleId: 1 });
        if (!admin) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }

        // Calculate pagination values
        var totalCount = await Collection.countDocuments({ userId: artistId.toString() });
        var totalPages = Math.ceil(totalCount / perPage);
        var lastPage = totalPages;
        const skip = (page - 1) * perPage;

        // Get paginated list of collections for artist
        collectionData = await Collection.find({ userId: artistId.toString() }).select({
            '_id': 0,
            'collectionImage': 1,
            'name': 1,
            'description': 1,
            'createdAt': 1,
            'collectionId': '$_id'
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(perPage);

        res.status(httpStatus.OK).json({
            collectionData,
            totalRecords: totalCount,
            totalPages,
            currentPage: page,
            perPage,
            lastPage
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
}

// Get list of live collections
const liveCollectionList = async (req, res) => {
    try {
        const adminId = req.claims;
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 3;

        // Verify admin user
        const admin = await User.findOne({ _id: adminId.userId, roleId: 1 });
        if (!admin) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }

        // Calculate pagination values
        var totalCount = await Collection.countDocuments();
        var totalPages = Math.ceil(totalCount / perPage);
        var lastPage = totalPages;
        const skip = (page - 1) * perPage;

        // Get paginated list of live collections
        collectionData = await Collection.find().select({
            '_id': 0,
            'collectionImage': 1,
            'name': 1,
            'description': 1,
            'createdAt': 1,
            'collectionId': '$_id',
            'status': 'live',
            'nftCount': '2323',
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(perPage);

        res.status(httpStatus.OK).json({
            collectionData,
            totalRecords: totalCount,
            totalPages,
            currentPage: page,
            perPage,
            lastPage
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
}

// Get list of recent activities (static data for now)
const recentActivityList = async (req, res) => {
    try {
        // Static data for ACTIVITY, COLLECTION, and DATE
        const staticData = [
            { activity: 'minting', collection: 'Space', date: '2023-10-19' },
            { activity: 'NFT buy', collection: 'Cricket', date: '2023-10-20' },
            { activity: 'auction', collection: 'Zombie', date: '2023-10-21' }
        ];

        const responseObj = { recentActivityData: staticData };

        res.status(httpStatus.OK).json(responseObj);

    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
}

// Get list of all collections
const collectionList = async (req, res) => {
    try {
        const adminId = req.claims;
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 2;

        // Verify user
        const admin = await User.findOne({ _id: adminId.userId });
        if (!admin) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }

        let collectionData;

        // Handle different user roles
        if (admin.roleId === 1) {
            // Admin can see all collections
            var totalCount = await Collection.countDocuments();
            var totalPages = Math.ceil(totalCount / perPage);
            var lastPage = totalPages;
            const skip = (page - 1) * perPage;

            collectionData = await Collection.find().select({
                '_id': 0,
                'collectionImage': 1,
                'name': 1,
                'description': 1,
                'isLaunch': 1,
                'createdAt': 1,
                'collectionIncId': 1,
                'collectionId': '$_id',
                'collectionAddress': 1
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(perPage);

        } else if (admin.roleId === 2) {
            // Artists can only see their own collections
            var totalCount = await Collection.countDocuments({ userId: admin._id.toString() });
            var totalPages = Math.ceil(totalCount / perPage);
            var lastPage = totalPages;
            const skip = (page - 1) * perPage;

            collectionData = await Collection.find({ userId: admin._id.toString() }).select({
                '_id': 0,
                'collectionImage': 1,
                'name': 1,
                'description': 1,
                'isLaunch': 1,
                'createdAt': 1,
                'collectionIncId': 1,
                'collectionId': '$_id',
                'collectionAddress': 1
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(perPage);
        }

        res.status(httpStatus.OK).json({
            collectionData,
            totalRecords: totalCount,
            totalPages,
            currentPage: page,
            perPage,
            lastPage
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
};

// Get list of NFTs in a collection
const nftList = async (req, res) => {
    try {
        const adminId = req.claims;
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 8;
        const collectionId = req.query.collectionId

        // Verify user
        const admin = await User.findOne({ _id: adminId.userId });
        if (!admin) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }

        // Verify collection exists and user has access
        const collection = await Collection.findOne({ _id: collectionId });
        if (!collection) {
            return res.status(httpStatus.NOT_FOUND).json({ error: 'Collection Not Found' });
        }

        if (admin.roleId === 1) {
            // Admin can see all collections
            const collection = await Collection.findOne({ _id: collectionId });
            if (!collection) {
                return res.status(httpStatus.NOT_FOUND).json({ error: 'Collection Not Found' });
            }
        } else if (admin.roleId === 2) {
            // Artists can only see their own collections
            const collection = await Collection.findOne({ _id: collectionId, userId: admin._id.toString() });
            if (!collection) {
                return res.status(httpStatus.NOT_FOUND).json({ error: 'Collection Not Found' });
            }
        }

        // Calculate pagination values
        var totalCount = await Nft.countDocuments({ collectionId: collectionId });
        var totalPages = Math.ceil(totalCount / perPage);
        var lastPage = totalPages;
        const skip = (page - 1) * perPage;

        // Get paginated list of NFTs
        nftData = await Nft.find({ collectionId: collectionId }).select({
            '_id': 0,
            'collectionId': 1,
            'price': 1,
            'nftImage': 1,
            'isMinted': 1,
            'name': 1,
            'createdAt': 1,
            'description': 1,
            'createdAt': 1,
            'nftId': 1,
            'nftTableId': '$_id'
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(perPage);

        // Update minted status if collection has an address
        if (collection.collectionAddress) {
            await updateMintedNft(collection.collectionAddress);
        }

        // json response
        res.status(httpStatus.OK).json({
            nftData,
            collectionName: collection.name,
            collectionId: collection._id,
            collectionImage: collection.collectionImage,
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

};


const viewCollection = async (req, res) => {
    try {

        const adminId = req.claims;
        const { collectionId } = req.query
        const admin = await User.findOne({ _id: adminId.userId });
        if (!admin) {
            // If the user is not found, send an error response
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorised user' });
        }

        if (admin.roleId === 1) {
            const aggregationPipeline = [
                {
                    $match: { _id: new mongoose.Types.ObjectId(collectionId) }, // Match the collection by _id
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
                        isLaunch: 1,
                        createdAt: 1,
                        nftCount: { $size: '$nfts' },
                        mintedCount: {
                            $size: {
                                $filter: {
                                    input: '$nfts',
                                    as: 'nft',
                                    cond: { $eq: ['$$nft.isMinted', true] },
                                },
                            },
                        },
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

            var collection = await Collection.aggregate(aggregationPipeline)
            var collection = collection[0]
            // Now, the 'collection' variable will contain the collection information
            // along with the total NFT count in the 'nftCount' field.
        } else if (admin.roleId === 2) {
            const aggregationPipeline = [
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(collectionId),
                        userId: admin._id.toString()

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
                        mintedCount: {
                            $size: {
                                $filter: {
                                    input: '$nfts',
                                    as: 'nft',
                                    cond: { $eq: ['$$nft.isMinted', true] },
                                },
                            },
                        },
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
        }

        if (!collection) {
            return res.status(httpStatus.NOT_FOUND).json({ error: 'Collection Not Found' });
        }


        if (collection.collectionAddress) {
            var collectionInfoSubgraph = await axios.post(config.SUBGRAPH_API, contractAddressWiseCollectionInfo(collection.collectionAddress))
            await updateMintedNft(collection.collectionAddress);
        }


        return res.status(httpStatus.OK).json({
            collectionId: collection._id,
            collectionName: collection.name,
            collectionImage: collection.collectionImage,
            description: collection.description,
            isLaunch: collection.isLaunch,
            createdAt: collection.createdAt,
            floorPrice: collectionInfoSubgraph?.data?.data?.collections[0]?.floorPrice || 0,
            totalNft: collection.nftCount,
            minthedNft: collectionInfoSubgraph?.data?.data?.collections[0]?.totalTokens || 0,
            ownerCount: collectionInfoSubgraph?.data?.data?.collections[0]?.ownerCount || 1,
        });


    } catch (error) {
        // Handle errors, for example, database errors
        console.error(error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }

};

const viewNft = async (req, res) => {
    try {
        const adminId = req.claims;
        const collectionId = req.query.collectionId
        const nftTableId = req.query.nftTableId


        const admin = await User.findOne({ _id: adminId.userId });
        if (!admin) {
            // If the user is not found, send an error response
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }


        if (admin.roleId === 1) {
            const collection = await Collection.findOne({ _id: collectionId });
            if (!collection) {
                return res.status(httpStatus.NOT_FOUND).json({ error: 'Collection Not Found' });
            }

        } else if (admin.roleId === 2) {
            const collection = await Collection.findOne({ _id: collectionId, userId: admin._id.toString() });
            if (!collection) {
                return res.status(httpStatus.NOT_FOUND).json({ error: 'Collection Not Found' });
            }

        }

        const nft = await Nft.findOne({ _id: nftTableId, collectionId: collectionId })

        if (!nft) {
            return res.status(httpStatus.NOT_FOUND).json({ error: 'Nft Not Found' });
        }
        console.log(nft)

        res.status(httpStatus.OK).json({
            nftTableId: nft._id,
            nftId: nft.nftId,
            name: nft.name,
            description: nft.description,
            price: nft.price,
            isMinted: nft.isMinted,
            createdAt: nft.createdAt,
            attributes: nft.attributes,

        });


    } catch (error) {
        // Handle errors, for example, database errors
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }

};



const mintedNftList = async (req, res) => {
    try {
        const adminId = req.claims;
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10;
        const collectionId = req.query.collectionId;

        const admin = await User.findOne({ _id: adminId.userId });
        if (!admin) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized user' });
        }

        const collection = handleCollectionByRoleId(admin.roleId, collectionId, admin._id.toString())
        if (!collection) return res.status(httpStatus.NOT_FOUND).json({ error: 'Collection Not Found' })


        let aggregationPipeline = [
            {
                $match: { _id: new mongoose.Types.ObjectId(collectionId) },
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
                $unwind: '$nfts', // Flatten the nfts array
            },
            {
                $match: { 'nfts.isMinted': true }, // Filter minted NFTs
            },
            {
                $group: {
                    _id: '$_id', // Group by the collection ID
                    nftData: { $push: '$nfts' }, // Push minted NFTs into an array
                    totalNftCount: { $sum: 1 },

                },
            },
            {
                $project: {
                    nftData: {
                        $slice: ['$nftData', (page - 1) * perPage, perPage], // Pagination
                    },
                    totalNftCount: 1,
                },
            },
        ];

        const [result] = await Collection.aggregate(aggregationPipeline);
        const nftData = result ? result.nftData : [];

        // Calculate total count, total pages, and other pagination data
        const totalCount = result?.totalNftCount || 0;
        const totalPages = Math.ceil(totalCount / perPage);
        const lastPage = totalPages;

        res.status(httpStatus.OK).json({
            nftData,
            totalRecords: totalCount,
            totalPages,
            currentPage: page,
            perPage,
            lastPage
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
};


const unmintedNftList = async (req, res) => {
    try {
        const adminId = req.claims;
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 1;
        const { collectionId } = req.query || {};

        const admin = await User.findOne({ _id: adminId.userId });
        if (!admin) {
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized user' });
        }

        const collection = handleCollectionByRoleId(admin.roleId, collectionId, admin._id.toString())
        if (!collection) return res.status(httpStatus.NOT_FOUND).json({ error: 'Collection Not Found' })

        let aggregationPipeline = [
            {
                $match: { _id: new mongoose.Types.ObjectId(collectionId) },
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
                $unwind: '$nfts', // Flatten the nfts array
            },
            {
                $match: { 'nfts.isMinted': false }, // Filter minted NFTs
            },
            {
                $group: {
                    _id: '$_id', // Group by the collection ID
                    collectionAddress: { $first: '$collectionAddress' },
                    nftData: { $push: '$nfts' }, // Push minted NFTs into an array
                    totalNftCount: { $sum: 1 },
                },
            },
            {
                $project: {
                    collectionAddress: 1,
                    nftData: {
                        $slice: ['$nftData', (page - 1) * perPage, perPage], // Pagination
                    },
                    totalNftCount: 1,
                },
            },
        ];

        const [result] = await Collection.aggregate(aggregationPipeline);
        const nftData = result ? result.nftData : [];
        nftData.forEach(element => {
            element.username = admin.username;
        });
        // Calculate total count, total pages, and other pagination data
        const totalCount = result?.totalNftCount || 0;
        const totalPages = Math.ceil(totalCount / perPage);
        const lastPage = totalPages;

        res.status(httpStatus.OK).json({
            collectionAddress: result?.collectionAddress ? result?.collectionAddress : null,
            nftData,
            totalRecords: totalCount,
            totalPages,
            currentPage: page,
            perPage,
            lastPage
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
};

const userNfts = async (req, res) => {
    try {
        const { walletAddress } = req.query || {}
        const user = req.claims;
        const admin = await User.findOne({ _id: user.userId, roleId: 1 });
        if (!admin) {
            // If the user is not found, send an error response
            return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthrised user' });
        }
        const page = parseInt(req.query.page) || 1;
        const first = parseInt(req.query.perPage) || 6;
        const skip = (page - 1) * first;
        const response = await axios.post(config.SUBGRAPH_API, getTokenByWalletAddress(walletAddress.toLowerCase(), first, skip));

        const myPortfolio = response?.data?.data?.owners[0]?.tokens || [];
        // Use Promise.all to execute all updates concurrently
        let newdata = []
        let collectionAddress
        await Promise.all(
            myPortfolio.map(async ({ tokenID, collection }) => {
                collectionAddress = collection.id
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
                            // _id: 1,
                            // nftCount: { $size: '$nfts' },
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
                const collection1 = await Collection.aggregate(aggregationPipeline);
                newdata.push(...collection1[0].nftData)
                // Return the result of this aggregation
            })
        );

        return res.status(httpStatus.OK).json({ collectionAddress: collectionAddress || null, nftData: newdata });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
}
//to check collection by roleId 
async function handleCollectionByRoleId(roleId, collectionId, userId) {
    try {
        if (roleId === 1) {
            var collection = await Collection.findOne({ _id: collectionId });
        } else if (roleId === 2) {
            var collection = await Collection.findOne({ _id: collectionId, userId: userId });
        } else {
            return null
        }
        return collection
    } catch (error) {
        throw error
    }
}

async function sendingEmail(subjectData, textData, email) {
    try {
        var transporter = nodemailer.createTransport({
            service: 'Gmail', // Service name
            auth: {
                user: config.SENDER_EMAIL,
                pass: config.SENDER_PASSWORD // Your email password
            }
        });
        var mailOptions = {
            from: config.SENDER_EMAIL, // Sender's email address
            to: email, // Recipient's email address
            subject: subjectData, // Email subject
            text: textData // Email content
        };

        await transporter.sendMail(mailOptions)
        return true
    } catch (error) {
        return false
    }
}


module.exports = {
    login, userNfts, recentActivityList, liveCollectionList, artistOwnCollectionList, myProfileInfo, userUpdatePassword, userProfileUpdate, createArtist, artistList, createUser, userList, collectionList, nftList, unmintedNftList, mintedNftList, viewNft, viewCollection
};
