// Query to get the latest NFT collection index
const getCollectionIndex = () => {
    return {
        query: `{\n  \n  nftcollectionCreateds(\n    orderBy: nftCollectionIndex\n    orderDirection: desc\n    first: 1\n  ) {\n    nftCollectionIndex\n  }\n}`
    };
}

// Query to get details of newest NFT collections, limited by condition parameter
const getNewCollection = (condition) => {
    return {
        query: `{\n \n  nftcollectionCreateds(\n    orderBy: nftCollectionIndex\n    orderDirection: desc\n    first: ${condition}\n  ) {\n    nftCollectionIndex\n    owner\n    symbol\n    name\n    collectionId\n    collectionAddress\n  }\n}`
    };
}

// Query collection info by contract address
const contractAddressWiseCollectionInfo = (condition) => {
    return {
        query: `{\n  collections(where: {id: \"${condition}\"}) {\n    name\n    nftStandard\n    owner\n    ownerCount\n    supply\n    symbol\n  floorPrice\n   totalTokens\n   \n  }\n}`
    };
}

// Query newest NFTs in a collection, limited by difference parameter
const getCollectionNewNFTS = (collectionAddress, diffrence) => {
    return {
        query: `{\n  collections(where: {id: \"${collectionAddress}\"}) {\n    id\n    name\n    nftStandard\n    owner\n    ownerCount\n    supply\n    symbol\n    tokens(first: ${diffrence}, orderBy: createdAt, orderDirection: desc) {\n      tokenID\n      supply\n      tokenURI\n createdAt\n   }\n  }\n}`
    };
}

// Query NFTs listed for fixed price sale by a specific artist
const nftsListedForFixSale = (walletAddress, first, skip) => {
    return {
        query: `{\n  nftlistedForSales(first: ${first},skip:${skip} where: {artist: \"${walletAddress}\",isEnded:false},) {\n    id\n    fixedSaleIndex\n    artist\n    nftContract\n    price\n    tokenContract\n    tokenId\n    isEnded\n    timestamp\n    transactionHash\n   \n    NFTOfferMadeOnFixedSales (first: ${first},skip:${skip}) {\n      offer\n      offerer\n      price\n      blockTimestamp\n    }\n  }\n}`
    }
}

// Query offers received by a wallet address for their NFTs
const getOffersByWalletAddress = (walletAddress, first, skip) => {
    return {
        query: `{\n  owners(\n    first: 10\n    where: {totalTokens_gt: \"0\", id: \"${walletAddress}\"}\n  ) {\n    tokens(first: ${first},skip:${skip} where: {OfferMadeForNonListedNFTs_: {isAccepted: false}}) {\n      tokenID\n      collection{\n        id\n      }\n      OfferMadeForNonListedNFTs {\n        nftContract\n        nonListIndex\n        offerAmount\n        offerer\n        timestamp\n        tokenId\n      }\n      \n    }\n  }\n}`
    }
}

// Query offers for a specific NFT by collection address and token ID
const getOffersBYcontrcatAddressAndTokenId = (collectionAddress, tokenID) => {
    return {
        query: `{\n  offerMadeForNonListedNFTs(\n    where: {nftContract: \"${collectionAddress}\", tokenId: \"${tokenID}\"}\n  ) {\n    nftContract\n    nonListIndex\n    offerAmount\n    offerer\n    timestamp\n    isAccepted\n    tokenId\n  }\n}`
    }
}

// Query all active fixed price sale listings with pagination
const allNftsListedForFixSale = (first, skip) => {
    return {
        query: `{\n  nftlistedForSales( first: ${first},skip:${skip}  where: {isEnded: false},) {\n    id\n    fixedSaleIndex\n    artist\n    nftContract\n    price\n    tokenContract\n    tokenId\n    isEnded\n    timestamp\n    transactionHash\n   \n    NFTOfferMadeOnFixedSales {\n      offer\n      offerer\n      price\n      blockTimestamp\n    }\n  }\n}`
    }
}

// Query bids made by a wallet address on fixed price sales
const getMySendBidsForFix = (walletAddress, first, skip) => {
    return {
        query: `{\n  nftofferMadeOnFixedSales(\n first: ${first},skip:${skip}    where: {NFTListedForSale_: {isEnded: false}, offerer: \"${walletAddress}\"},OfferMadeForNonListedNFT_: {isAccepted: false}\n  ) {\n    NFTListedForSale {\n      fixedSaleIndex\n      isEnded\n      nftContract\n      price\n      timestamp\n      tokenContract\n      tokenId\n      artist\n      blockNumber\n    }\n    offerer\n    offer\n    blockTimestamp\n  }\n}`
    }
}

// Query auctions where a specific wallet address has placed bids
const getAuctionByWalletAddress = (walletAddress, first, skip) => {
    return {
        query: `{\n  nftbidPlaceds(first: ${first},skip:${skip} where: {bidder: \"${walletAddress}\",, NFTListedForAuction_: {isEnded: false}}) {\n    NFTListedForAuction {\n     auctionIndex\n      artist\n      isEnded\n      nftContract\n      startPrice\n      minBidIncrementPercentage\n      tokenContract\n      tokenId\n      timestamp\n      transactionHash\n    }\n  amount\n  bidder\n  blockTimestamp\n }\n}`
    }
}

// Query information about trending collections
const hotCollectionInfo = () => {
    return {
        query: `{\n  collections {\n  id\n  name\n    nftStandard\n       owner\n    ownerCount\n    supply\n    symbol\n    totalTokens\n   \n  }\n}`
    };
}

// Query offers made on a specific fixed price listing
const getFixlistedOffers = (condition) => {
    return {
        query: `{\n  nftofferMadeOnFixedSales(where: {fixedSaleIndex: \"${condition}\"}) {\n    blockTimestamp\n    fixedSaleIndex\n    nftContract\n    offer\n    offerer\n    price\n    tokenContract\n    tokenId\n    transactionHash\n  }\n}`
    };
}

// Query bids placed on a specific auction
const getAuctionsOfferInfo = (condition) => {
    return {
        query: `{\n  nftbidPlaceds(where: {auctionIndex: \"${condition}\"}, orderBy: amount, orderDirection: desc) {\n    amount\n    bidder\n    blockTimestamp\n    nftContract\n    timestamp\n    tokenContract\n    tokenId\n    transactionHash\n  }\n}`
    };
}

// Query active auctions by a specific artist
const auctionList = (condition, first, skip) => {
    return {
        query: `{\n  nftlistedForAuctions(\n  first: ${first},skip:${skip}  where: {artist: \"${condition}\"\n, isEnded: false}\n  ) {\n    auctionIndex\n    nftContract\n    tokenContract\n    artist\n    startPrice\n    timestamp\n    endTime\n    isEnded\n    tokenId\n    transactionHash\n    minBidIncrementPercentage\n    blockTimestamp\n    NFTBidPlaced(first: ${first},skip:${skip}, orderBy: blockTimestamp, orderDirection: desc) {\n      blockTimestamp\n      amount\n    }\n  }\n}`
    };
}

// Query all active auctions with pagination
const AllauctionList = (first, skip) => {
    return {
        query: `{\n  nftlistedForAuctions(\n first: ${first},skip:${skip}   where: {isEnded: false}\n  ) {\n    auctionIndex\n    nftContract\n    tokenContract\n    artist\n    startPrice\n    timestamp\n    endTime\n    isEnded\n    tokenId\n    transactionHash\n    minBidIncrementPercentage\n    blockTimestamp\n    NFTBidPlaced(first: 1, orderBy: blockTimestamp, orderDirection: desc) {\n      blockTimestamp\n      amount\n    }\n  }\n}`
    };
}

// Query detailed collection information including tokens with pagination
const getCollectionInfoByContarct = (condition, first, skip) => {
    return {
        query: `{\n  collections(\n  where: {id: \"${condition}\"}) {\n    name\n    nftStandard\n    owner\n    ownerCount\n    supply\n    symbol\n    id\n    floorPrice\n    totalTokens\n    volume\n    tokens (first: ${first},skip:${skip}){\n      supply\n      tokenID\n      tokenURI\n      saleType\n  indexId\n marketPrice\n     owner {\n        id\n      }\n    }\n  }\n}`
    };
}

// Query detailed information about a specific auction by its index
const auctionInfoByIndexId = (condition) => {
    return {
        query: `{\n  nftlistedForAuctions(where: {auctionIndex: \"${condition}\"}) {\n    artist\n    auctionIndex\n    blockTimestamp\n    endTime\n    isEnded\n    minBidIncrementPercentage\n    nftContract\n    startPrice\n    timestamp\n    tokenContract\n    tokenId\n    transactionHash\n    NFTBidPlaced(orderBy: blockTimestamp, orderDirection: desc) {\n      amount\n      bidder\n      blockTimestamp\n      nftContract\n      timestamp\n      tokenContract\n      transactionHash\n    }\n  }\n}`
    };
}

// Export all query functions
module.exports = {
    getCollectionIndex,
    getAuctionsOfferInfo,
    getAuctionByWalletAddress,
    getMySendBidsForFix,
    getFixlistedOffers,
    getNewCollection,
    getOffersBYcontrcatAddressAndTokenId,
    contractAddressWiseCollectionInfo,
    getCollectionNewNFTS,
    nftsListedForFixSale,
    allNftsListedForFixSale,
    hotCollectionInfo,
    auctionList,
    AllauctionList,
    getOffersByWalletAddress,
    getCollectionInfoByContarct,
    auctionInfoByIndexId
}