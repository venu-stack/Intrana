// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

interface IERC721 {
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;

    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IERC20 {
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external;

    function transfer(address to, uint256 amount) external;

    function balanceOf(address account) external view returns (uint256);
}

contract NFTMarketplace is Ownable, ERC721Holder {
    // Struct for fixed price sale
    struct FixedPriceSale {
        address nftContract;
        uint256 tokenId;
        uint256 price;
        address artist;
        address buyer;
        bool active;
    }

    // Struct for auction
    struct Auction {
        address nftContract;
        uint256 tokenId;
        address artist;
        uint256 startPrice;
        uint256 minBidIncrementPercentage;
        uint256 endTime;
        address currentHighestBidder;
        uint256 currentHighestBid;
        bool active;
        bool startPriceHit;
    }

    // Struct for fixed sale offer
    struct FixedSaleOffer {
        address offerer;
        uint256 offerAmount;
    }

    // Struct for non list offer
    struct NonListOffer {
        address offerer;
        address nftContract;
        uint256 tokenId;
        uint256 offerAmount;
    }

    // Mapping to store fixed price sale details
    mapping(uint256 => FixedPriceSale) public fixedPriceSales;

    // Mapping to store auction details
    mapping(uint256 => Auction) public auctions;

    // Mapping to store all offer for fixed price sale
    mapping(uint256 => mapping(address => FixedSaleOffer)) public offers;

    // Mapping to store all bids for auction
    mapping(uint256 => mapping(address => uint256)) public bids;

    // Mapping to store offer on non listed NFT
    mapping(uint256 => NonListOffer) public nonListOffers;

    // Count of fixed price sales
    uint256 public fixedSaleIndex;

    // Count of auctions
    uint256 public auctionIndex;

    // Count of non list offers
    uint256 public nonListIndex;

    // Token contract
    IERC20 public tokenContract;

    // Required events
    event TokenContractChanged(address newTokenContract, uint256 timestamp);

    event NFTListedForSale(
        uint256 fixedSaleIndex,
        address nftContract,
        address tokenContract,
        uint256 tokenId,
        uint256 price,
        address artist,
        uint256 timestamp
    );

    event NFTRemovedFromFixedSale(
        uint256 fixedSaleIndex,
        address nftContract,
        address tokenContract,
        uint256 tokenId,
        address artist,
        uint256 timestamp
    );

    event NFTPurchasedFromFixedSale(
        uint256 fixedSaleIndex,
        address nftContract,
        address tokenContract,
        uint256 tokenId,
        address buyer,
        uint256 price,
        uint256 timestamp
    );

    event NFTOfferMadeOnFixedSale(
        uint256 fixedSaleIndex,
        address nftContract,
        address tokenContract,
        uint256 tokenId,
        address offerer,
        uint256 price,
        uint256 offer,
        uint256 timestamp
    );

    event NFTFixedSaleOfferAccepted(
        uint256 fixedSaleIndex,
        address nftContract,
        address tokenContract,
        uint256 tokenId,
        address artist,
        address offerer,
        uint256 offer,
        uint256 timestamp
    );

    event NFTFixedSaleOfferRejected(
        uint256 fixedSaleIndex,
        address nftContract,
        address tokenContract,
        uint256 tokenId,
        address artist,
        address offerer,
        uint256 offer,
        uint256 timestamp
    );

    event NFTListedForAuction(
        uint256 auctionIndex,
        address nftContract,
        address tokenContract,
        uint256 tokenId,
        uint256 startPrice,
        uint256 minBidIncrementPercentage,
        uint256 endTime,
        address artist,
        uint256 timestamp
    );

    event NFTRemovedFromAuction(
        uint256 auctionIndex,
        address nftContract,
        address tokenContract,
        uint256 tokenId,
        address currentHighestBidder,
        uint256 currentHighestBid,
        uint256 timestamp
    );

    event NFTBidPlaced(
        uint256 auctionIndex,
        address nftContract,
        address tokenContract,
        uint256 tokenId,
        address bidder,
        uint256 amount,
        uint256 timestamp
    );

    event NFTAuctionTimeExtended(
        uint256 auctionIndex,
        address nftContract,
        address tokenContract,
        uint256 tokenId,
        address bidder,
        uint256 amount,
        uint256 timestamp
    );

    event NFTAuctionBidAccepted(
        uint256 auctionIndex,
        address nftContract,
        address tokenContract,
        uint256 tokenId,
        address artist,
        address winner,
        uint256 winningBid,
        uint256 timestamp
    );

    event NFTAuctionPreviousBidAccepted(
        uint256 auctionIndex,
        address nftContract,
        address tokenContract,
        uint256 tokenId,
        address artist,
        address winner,
        uint256 winningBid,
        uint256 timestamp
    );

    event OfferMadeForNonListedNFT(
        uint256 nonListIndex,
        address offerer,
        address nftContract,
        uint256 tokenId,
        uint256 offerAmount,
        uint256 timestamp
    );

    event OfferAcceptedForNonListedNFT(
        uint256 nonListIndex,
        address owner,
        address offerer,
        address nftContract,
        uint256 tokenId,
        uint256 offerAmount,
        uint256 timestamp
    );

    event OfferRejectedForNonListedNFT(
        uint256 nonListIndex,
        address owner,
        address offerer,
        address nftContract,
        uint256 tokenId,
        uint256 offerAmount,
        uint256 timestamp
    );

    constructor(address _tokenContract) Ownable(msg.sender) {
        tokenContract = IERC20(_tokenContract);
    }

    // Function to change token contract address
    function changeTokenContract(address newTokenContract) external onlyOwner {
        tokenContract = IERC20(newTokenContract);

        emit TokenContractChanged(newTokenContract, block.timestamp);
    }

    // Function to check if contract is valid
    function isContract(address contractAddress) private view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(contractAddress)
        }
        return size > 0;
    }

    // Function for listing NFT for fixed price sale
    function listNFTForFixedSale(
        uint256 tokenId,
        uint256 price,
        address nftContract
    ) external {
        require(isContract(nftContract), "Invalid NFT contract address");
        require(
            IERC721(nftContract).ownerOf(tokenId) == msg.sender,
            "Only NFT owner can list NFT for fixed sale"
        );
        require(price > 0, "Price cannot be 0");

        fixedSaleIndex++;

        fixedPriceSales[fixedSaleIndex] = FixedPriceSale(
            nftContract,
            tokenId,
            price,
            msg.sender,
            address(0),
            true
        );

        // Allow marketplace to hold the NFT
        IERC721(nftContract).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId
        );

        emit NFTListedForSale(
            fixedSaleIndex,
            nftContract,
            address(tokenContract),
            tokenId,
            price,
            msg.sender,
            block.timestamp
        );
    }

    // Function for removing NFT from fixed price sale
    function removeNFTFromFixedSale(uint256 _fixedSaleIndex) external {
        FixedPriceSale storage sale = fixedPriceSales[_fixedSaleIndex];
        require(sale.active == true, "This NFT is not listed for fixed sale");
        require(
            sale.artist == msg.sender,
            "Only NFT owner can remove NFT from fixed sale"
        );

        // Release NFT from marketplace back to the owner
        IERC721(sale.nftContract).safeTransferFrom(
            address(this),
            msg.sender,
            sale.tokenId
        );

        sale.active = false;

        emit NFTRemovedFromFixedSale(
            _fixedSaleIndex,
            sale.nftContract,
            address(tokenContract),
            sale.tokenId,
            msg.sender,
            block.timestamp
        );
    }

    // Function for purchasing NFT from fixed price sale
    function purchaseNFTFromFixedSale(uint256 _fixedSaleIndex) external {
        FixedPriceSale storage sale = fixedPriceSales[_fixedSaleIndex];
        require(sale.active == true, "This NFT is not listed for fixed sale");
        require(
            tokenContract.balanceOf(msg.sender) >= sale.price,
            "Not enough token balance"
        );

        sale.buyer = msg.sender;

        // Transfer NFT to the purchaser
        tokenContract.transferFrom(sale.buyer, sale.artist, sale.price);
        IERC721(sale.nftContract).safeTransferFrom(
            address(this),
            msg.sender,
            sale.tokenId
        );

        sale.active = false;

        emit NFTPurchasedFromFixedSale(
            _fixedSaleIndex,
            sale.nftContract,
            address(tokenContract),
            sale.tokenId,
            msg.sender,
            sale.price,
            block.timestamp
        );
    }

    // Function for making an offer on NFT for fixed price sale
    function makeOfferForFixedSaleNFT(
        uint256 _fixedSaleIndex,
        uint256 offerAmount
    ) external {
        FixedPriceSale storage sale = fixedPriceSales[_fixedSaleIndex];
        require(sale.active == true, "This NFT is not listed for fixed sale");
        require(
            msg.sender != sale.artist,
            "NFT owner cannot make offer on his own NFT"
        );
        require(offerAmount > 0, "Offer amount cannot be 0");

        offers[_fixedSaleIndex][msg.sender].offerer = msg.sender;
        offers[_fixedSaleIndex][msg.sender].offerAmount = offerAmount;

        emit NFTOfferMadeOnFixedSale(
            _fixedSaleIndex,
            sale.nftContract,
            address(tokenContract),
            sale.tokenId,
            msg.sender,
            sale.price,
            offerAmount,
            block.timestamp
        );
    }

    // Function for accepting an offer on NFT for fixed price sale
    function acceptOfferForFixedSaleNFT(
        uint256 _fixedSaleIndex,
        address offerer
    ) external {
        FixedPriceSale storage sale = fixedPriceSales[_fixedSaleIndex];
        require(sale.active == true, "This NFT is not listed for sale");
        require(msg.sender == sale.artist, "Only NFT owner can accept offer");

        // Get previous bid of the previous bidder with enough token balance
        uint256 offerAmount = offers[_fixedSaleIndex][offerer].offerAmount;

        // Check if offerer has enough token balance
        require(
            tokenContract.balanceOf(offerer) >= offerAmount,
            "Offerer does not have enough token balance"
        );

        // Transfer NFT to the highest bidder with enough token balance
        tokenContract.transferFrom(offerer, msg.sender, offerAmount);
        IERC721(sale.nftContract).safeTransferFrom(
            address(this),
            offerer,
            sale.tokenId
        );

        sale.active = false;

        emit NFTFixedSaleOfferAccepted(
            _fixedSaleIndex,
            sale.nftContract,
            address(tokenContract),
            sale.tokenId,
            msg.sender,
            offerer,
            offerAmount,
            block.timestamp
        );
    }

    // Function for rejecting an offer on NFT for fixed price sale
    function rejectOfferForFixedSaleNFT(
        uint256 _fixedSaleIndex,
        address offerer
    ) external {
        FixedPriceSale storage sale = fixedPriceSales[_fixedSaleIndex];
        require(sale.active == true, "This NFT is not listed for sale");
        require(
            msg.sender == sale.artist ||
                msg.sender == offers[_fixedSaleIndex][offerer].offerer,
            "Not NFT owner or offerer"
        );

        uint256 offerAmount = offers[_fixedSaleIndex][offerer].offerAmount;
        delete offers[_fixedSaleIndex][offerer];

        emit NFTFixedSaleOfferRejected(
            _fixedSaleIndex,
            sale.nftContract,
            address(tokenContract),
            sale.tokenId,
            msg.sender,
            offerer,
            offerAmount,
            block.timestamp
        );
    }

    // Function for listing NFT for auction
    function listNFTForAuction(
        uint256 tokenId,
        uint256 startPrice,
        uint256 minBidIncrementPercentage,
        uint256 duration,
        address nftContract
    ) external {
        require(isContract(nftContract), "Invalid NFT contract address");
        require(
            IERC721(nftContract).ownerOf(tokenId) == msg.sender,
            "Only NFT owner can list NFT for auction"
        );
        require(startPrice > 0, "Start price cannot be 0");

        uint256 endTime = block.timestamp + duration;

        auctionIndex++;

        auctions[auctionIndex] = Auction(
            nftContract,
            tokenId,
            msg.sender,
            startPrice,
            minBidIncrementPercentage,
            endTime,
            address(0),
            startPrice,
            true,
            false
        );

        // Allow marketplace to hold the NFT
        IERC721(nftContract).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId
        );

        emit NFTListedForAuction(
            auctionIndex,
            nftContract,
            address(tokenContract),
            tokenId,
            startPrice,
            minBidIncrementPercentage,
            endTime,
            msg.sender,
            block.timestamp
        );
    }

    // Function for removing NFT from auction
    function removeNFTFromAuction(uint256 _auctionIndex) external {
        Auction storage auction = auctions[_auctionIndex];
        require(auction.active == true, "This NFT is not listed for auction");
        require(
            auction.artist == msg.sender,
            "Only NFT owner can remove NFT from auction"
        );

        // Release NFT from marketplace back to the owner
        IERC721(auction.nftContract).safeTransferFrom(
            address(this),
            msg.sender,
            auction.tokenId
        );

        auction.active = false;

        emit NFTRemovedFromAuction(
            _auctionIndex,
            auction.nftContract,
            address(tokenContract),
            auction.tokenId,
            msg.sender,
            auction.currentHighestBid,
            block.timestamp
        );
    }

    // Function for placing a bid on NFT listed for auction
    function placeNFTAuctionBid(uint256 _auctionIndex, uint256 bidAmount)
        external
    {
        Auction storage auction = auctions[_auctionIndex];
        require(auction.active == true, "This NFT is not listed for auction");
        require(
            block.timestamp < auction.endTime,
            "This NFT auction has already ended"
        );
        require(
            msg.sender != auction.artist,
            "NFT owner cannot bid on his own NFT"
        );
        require(bidAmount > 0, "Bid amount cannot be 0");

        if (auction.startPriceHit == true) {
            uint256 minBidIncrement = (auction.currentHighestBid *
                auction.minBidIncrementPercentage) / 100;
            require(
                bidAmount >= (auction.currentHighestBid + minBidIncrement),
                "NFT bid amount must be greater"
            );
        }

        auction.currentHighestBidder = msg.sender;
        auction.currentHighestBid = bidAmount;
        bids[_auctionIndex][msg.sender] = bidAmount;

        // Extend auction by 30 min if bid gets placed in the last 30 min of auction
        if (auction.endTime - block.timestamp <= 1800) {
            auction.endTime += 1800;
        }

        emit NFTAuctionTimeExtended(
            auctionIndex,
            auction.nftContract,
            address(tokenContract),
            auction.tokenId,
            msg.sender,
            bidAmount,
            block.timestamp
        );
        emit NFTBidPlaced(
            _auctionIndex,
            auction.nftContract,
            address(tokenContract),
            auction.tokenId,
            msg.sender,
            bidAmount,
            block.timestamp
        );
    }

    // Function for accepting the highest NFT auction bid and ending the auction
    function acceptNFTAuctionHighestBid(uint256 _auctionIndex) external {
        Auction storage auction = auctions[_auctionIndex];
        require(auction.active == true, "This NFT auction is no longer active");
        require(
            auction.artist == msg.sender,
            "Only NFT owner can end NFT auction"
        );

        address currentHighestBidder = auction.currentHighestBidder;
        uint256 currentHighestBid = auction.currentHighestBid;

        // Check if current highest bidder has enough token balance
        require(
            tokenContract.balanceOf(currentHighestBidder) >= currentHighestBid,
            "Highest bidder does not have enough token balance"
        );

        // Transfer NFT to the highest bidder with enough token balance
        tokenContract.transferFrom(
            currentHighestBidder,
            msg.sender,
            currentHighestBid
        );
        IERC721(auction.nftContract).safeTransferFrom(
            address(this),
            currentHighestBidder,
            auction.tokenId
        );

        auction.active = false;

        emit NFTAuctionBidAccepted(
            _auctionIndex,
            auction.nftContract,
            address(tokenContract),
            auction.tokenId,
            msg.sender,
            auction.currentHighestBidder,
            auction.currentHighestBid,
            block.timestamp
        );
    }

    // Function for accepting previous NFT bids if accepting highest bid fails
    function acceptNFTAuctionPreviousBid(
        uint256 _auctionIndex,
        address previousBidder
    ) external {
        Auction storage auction = auctions[_auctionIndex];
        require(auction.active == true, "This NFT auction is no longer active");
        require(auction.artist == msg.sender, "not nft owner");

        // Get previous bid of the previous bidder with enough token balance
        uint256 previousBid = bids[_auctionIndex][previousBidder];

        // Check if previous bidder has enough token balance
        require(
            tokenContract.balanceOf(previousBidder) >= previousBid,
            "Bidder does not have enough token balance"
        );

        // Transfer NFT to the previous bidder with enough token balance
        tokenContract.transferFrom(previousBidder, msg.sender, previousBid);
        IERC721(auction.nftContract).safeTransferFrom(
            address(this),
            previousBidder,
            auction.tokenId
        );

        auction.active = false;

        emit NFTAuctionPreviousBidAccepted(
            _auctionIndex,
            auction.nftContract,
            address(tokenContract),
            auction.tokenId,
            msg.sender,
            previousBidder,
            previousBid,
            block.timestamp
        );
    }

    // Function for making buy offer on NFT not listed
    function makeOfferForNFT(
        address nftContract,
        uint256 tokenId,
        uint256 offerAmount
    ) external {
        require(isContract(nftContract), "Invalid NFT contract address");
        require(
            IERC721(nftContract).ownerOf(tokenId) != address(0),
            "NFT does not exist"
        );
        require(offerAmount > 0, "Offer amount should be more than 0");

        nonListIndex++;

        // Store the offer in non listed offers mapping
        nonListOffers[nonListIndex] = NonListOffer(
            msg.sender,
            nftContract,
            tokenId,
            offerAmount
        );

        emit OfferMadeForNonListedNFT(
            nonListIndex,
            msg.sender,
            nftContract,
            tokenId,
            offerAmount,
            block.timestamp
        );
    }

    // Function for accepting offer on NFT not listed
    function acceptOfferForNFT(uint256 _nonListIndex) external {
        NonListOffer storage nonListOffer = nonListOffers[_nonListIndex];
        require(
            isContract(nonListOffer.nftContract),
            "Invalid NFT contract address"
        );
        require(
            IERC721(nonListOffer.nftContract).ownerOf(nonListOffer.tokenId) ==
                msg.sender,
            "Not NFT owner"
        );

        // Get offer amount from non listed offers mapping
        require(
            tokenContract.balanceOf(nonListOffer.offerer) >=
                nonListOffer.offerAmount,
            "Offerer does not have enough token balance"
        );

        // Transfer NFT to the offerer
        tokenContract.transferFrom(
            nonListOffer.offerer,
            msg.sender,
            nonListOffer.offerAmount
        );
        IERC721(nonListOffer.nftContract).safeTransferFrom(
            msg.sender,
            nonListOffer.offerer,
            nonListOffer.tokenId
        );

        emit OfferAcceptedForNonListedNFT(
            _nonListIndex,
            msg.sender,
            nonListOffer.offerer,
            nonListOffer.nftContract,
            nonListOffer.tokenId,
            nonListOffer.offerAmount,
            block.timestamp
        );
    }

    // Function for rejecting offer on NFT not listed
    function rejectOfferForNFT(uint256 _nonListIndex) external {
        NonListOffer storage nonListOffer = nonListOffers[_nonListIndex];
        require(
            isContract(nonListOffer.nftContract),
            "Invalid NFT contract address"
        );
        require(
            IERC721(nonListOffer.nftContract).ownerOf(nonListOffer.tokenId) ==
                msg.sender ||
                nonListOffer.offerer == msg.sender,
            "Not NFT owner or offerer"
        );

        delete nonListOffers[_nonListIndex];

        emit OfferRejectedForNonListedNFT(
            _nonListIndex,
            msg.sender,
            nonListOffer.offerer,
            nonListOffer.nftContract,
            nonListOffer.tokenId,
            nonListOffer.offerAmount,
            block.timestamp
        );
    }
}
