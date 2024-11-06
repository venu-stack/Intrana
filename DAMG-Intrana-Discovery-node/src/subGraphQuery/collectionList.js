// Query to get a list of NFT collections with pagination and sorting
// Parameters:
// - conditions: Additional filtering conditions to apply to the query
module.exports = function (conditions) {
    return {
        query:
            `
        {
            nftcollectionCreateds(
                first: 10,                    # Number of collections to return
                orderBy: timestamp,           # Sort by timestamp field
                orderDirection: desc,         # Sort in descending order (newest first)
                skip: 0,                      # Pagination offset
                ${conditions}                 # Additional query conditions
            ) {
                collectionAddress            # Contract address of the collection
                owner                        # Creator/owner address
                nftCollectionIndex          # Unique index of the collection
                name                        # Collection name
                symbol                      # Collection symbol/ticker
                collectionId               # Unique identifier for the collection
                timestamp                  # Creation timestamp
                transactionHash           # Transaction hash of creation
                blockTimestamp           # Block timestamp of creation
            }
        }
    `
    };
};