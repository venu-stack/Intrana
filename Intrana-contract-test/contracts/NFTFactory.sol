// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./NFTContract.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external;
}

contract NFTFactory is Ownable {
    // Struct for NFT collection data
    struct NFTCollectionData {
        NFTContract nftContract;
        address owner;
        string name;
        string symbol;
        string uri;
        uint256 collectionId;
    }

    // NFT collections count
    uint256 public nftCollectionIndex;

    // Mapping for storing address to indexes of NFT collections
    mapping(address => mapping(uint256 => NFTCollectionData))
        public nftCollectionData;

    // Mapping to track used collectionIds
    mapping(uint256 => bool) public usedCollectionIds;

    event NFTCollectionCreated(
        address collectionAddress,
        address owner,
        uint256 nftCollectionIndex,
        string name,
        string symbol,
        string uri,
        uint256 collectionId,
        uint256 timestamp
    );

    event TokensWithdrawnByOwner(
        address owner,
        address tokenAddress,
        uint256 amount,
        uint256 timestamp
    );

    constructor() Ownable(msg.sender) {}

    // Function to check if contract is valid
    function isContract(address contractAddress) private view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(contractAddress)
        }
        return size > 0;
    }

    // Create a new NFT collection
    function createNFTCollection(
        string memory name,
        string memory symbol,
        string memory uri,
        uint256 collectionId
    ) external {
        require(
            usedCollectionIds[collectionId] == false,
            "Collection id already used"
        );
        usedCollectionIds[collectionId] = true;

        NFTContract nftCollection = new NFTContract(
            name,
            symbol,
            uri,
            msg.sender
        );

        nftCollectionIndex++;

        // Store the NFT collection data, including the contract instance
        nftCollectionData[msg.sender][nftCollectionIndex] = NFTCollectionData(
            nftCollection,
            msg.sender,
            name,
            symbol,
            uri,
            collectionId
        );

        emit NFTCollectionCreated(
            address(nftCollection),
            msg.sender,
            nftCollectionIndex,
            name,
            symbol,
            uri,
            collectionId,
            block.timestamp
        );
    }

    // Function to withdraw accidentally transferred tokens
    function withdrawTokens(address tokenAddress, uint256 amount)
        external
        onlyOwner
    {
        require(isContract(tokenAddress), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");

        // Transfer the tokens from this contract to the owner
        IERC20(tokenAddress).transfer(msg.sender, amount);

        emit TokensWithdrawnByOwner(
            msg.sender,
            tokenAddress,
            amount,
            block.timestamp
        );
    }
}
