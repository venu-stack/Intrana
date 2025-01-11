// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

// Importing necessary contracts and libraries
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// NFTContract contract inheriting from ERC721URIStorage and Ownable
contract NFTContract is ERC721URIStorage, Ownable {
    // Base token URI
    string public baseTokenURI;

    // Constructor to initialize the contract
    constructor(
        string memory name,
        string memory symbol,
        string memory baseUri,
        address owner
    ) ERC721(name, symbol) Ownable(owner) {
        baseTokenURI = baseUri;
    }

    // Function to mint a single NFT
    function mint(address to, uint256 tokenId) external onlyOwner {
        _mint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI(tokenId));
    }

    // Function to mint multiple NFTs
    function mintBatch(address[] calldata to, uint256[] calldata tokenIds)
        external
        onlyOwner
    {
        // Check if the arrays have the same length
        require(
            to.length == tokenIds.length,
            "Arrays must have the same length"
        );

        // Loop through the tokenIds array and mint NFTs
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _mint(to[i], tokenIds[i]);
            _setTokenURI(tokenIds[i], _tokenURI(tokenIds[i]));
        }
    }

    // Internal function to get the token URI
    function _tokenURI(uint256 tokenId) internal view returns (string memory) {
        return
            string(abi.encodePacked(baseTokenURI, Strings.toString(tokenId)));
    }
}
