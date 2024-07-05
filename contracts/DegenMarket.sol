// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

//errors
error DegenMarket_PriceMustBeAboveZero();
error DegenMarket__NotApprovedForMarket();
error DegenMarket_AlreadyListed(address nftAddress, uint256 tokenId);
error DegenMarket__NotOwner();
error DegenMarket__NotListed(address nftAddress,uint256 tokenId);
error DegenMarket__PriceNotMet(address nftAddress,uint256 tokenId,uint256 price);
error DegenMarket__NoProceeds();
error DegenMarket__TransferFailed();

contract DegenMarket is ReentrancyGuard{
    struct Listing {
        uint256 price;
        address seller;
    }

    ///////////
    // Modifiers
    ///////////
    modifier notListed(
        address nftAddress,
        uint256 tokenId,
        address owner
    ) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert DegenMarket_AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);

        if (owner != spender) {
            revert DegenMarket__NotOwner();
        }

        _;
    }

    modifier isListed(address nftAddress,uint256 tokenId) {
        Listing memory nft = s_listings[nftAddress][tokenId];
        if(nft.price <= 0){
            revert DegenMarket__NotListed(nftAddress,tokenId);
        }
        _;
    }

    ///////////
    // Events
    ///////////
    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBought(address indexed buyer,address indexed nftAddress, uint256 indexed tokenId, uint256 price);

    event ItemCanceled(address indexed owner,address indexed nftAddress,uint256 indexed tokenId);

    //NFT Add -> Id -> Listed Item
    mapping(address => mapping(uint256 => Listing)) private s_listings;

    //Seller -> Amount 
    mapping(address => uint256) private s_proceeds;

    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external notListed(nftAddress, tokenId, msg.sender) isOwner(nftAddress,tokenId,msg.sender)
    {
        if (price <= 0) {
            revert DegenMarket_PriceMustBeAboveZero();
        }

        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert DegenMarket__NotApprovedForMarket();
        }

        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);

        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    /// Buy the listed NFT
    function buyItem(address nftAddress,uint256 tokenId) external payable nonReentrant isListed(nftAddress, tokenId){
        
        Listing memory listedItem = s_listings[nftAddress][tokenId];

        if(msg.value < listedItem.price){
            revert DegenMarket__PriceNotMet(nftAddress,tokenId,listedItem.price);
        }

        s_proceeds[listedItem.seller] = s_proceeds[listedItem.seller] + listedItem.price;
        delete (s_listings[nftAddress][tokenId]);

        IERC721(nftAddress).safeTransferFrom(listedItem.seller,msg.sender,tokenId);
        
        emit ItemBought(msg.sender,nftAddress,tokenId,listedItem.price);
    }

    //Cancel the listing
    function cancelListing(address nftAddress,uint256 tokenId) external isOwner(nftAddress,tokenId,msg.sender) isListed(nftAddress, tokenId){
        delete (s_listings[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender,nftAddress,tokenId);
    }

    //update the listing
    function updateListing(address nftAddress,uint256 tokenId,uint256 newPrice) external isOwner(nftAddress,tokenId,msg.sender) isListed(nftAddress, tokenId){

        s_listings[nftAddress][tokenId].price = newPrice;

        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
        
    } 


    //Withdrawing the money
    function withdrawProceeds() external nonReentrant{
        uint256 amount = s_proceeds[msg.sender];
        if(amount <= 0){
            revert DegenMarket__NoProceeds();
        }

        s_proceeds[msg.sender] = 0;

        (bool sent, ) = payable(msg.sender).call{value:amount}("");
        if(!sent){
            revert DegenMarket__TransferFailed();
        }

    }

    function getListing(address nftAddress, uint256 tokenId)
        external
        view
        returns (Listing memory)
    {
        return s_listings[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }

}
