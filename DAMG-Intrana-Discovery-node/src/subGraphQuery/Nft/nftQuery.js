// Query to get NFT tokens owned by a specific wallet address
// Parameters:
// - condition: Wallet address to query tokens for
// - first: Number of tokens to return per page
// - skip: Number of tokens to skip for pagination
const getTokenByWalletAddress = (condition, first, skip) => {
    return {
        query: `{\n  owners(\n    where: {totalTokens_gt: \"0\", id: \"${condition}\"}\n  ) {\n    id\n    totalTokens\n    tokens (first: ${first}\n skip:${skip} ) {\n      tokenID\n      tokenURI\n      collection {\n        id\n      }\n    }\n  }\n}`
    };
}

// Export the query function
module.exports = {
    getTokenByWalletAddress
}