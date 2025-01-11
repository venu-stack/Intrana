// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTAccessControl {
    IERC721 public nftContract;
    uint256 public requiredTokenId;

    constructor(address _nftContract, uint256 _requiredTokenId) {
        nftContract = IERC721(_nftContract);
        requiredTokenId = _requiredTokenId;
    }

    function hasAccess(address user) external view returns (bool) {
        return nftContract.ownerOf(requiredTokenId) == user;
    }
}
