// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title TrustMeBroNFT
 * @notice A soulbound ERC721 NFT that users purchase with USDC to access the game
 * @dev Soulbound implementation - tokens cannot be transferred after minting
 */
contract TrustMeBroNFT is ERC721, ReentrancyGuard, Ownable, Pausable {
    using Strings for uint256;

    // ============ State Variables ============

    /// @notice The ERC20 token used for payment (USDC)
    IERC20 public immutable PAYMENT_TOKEN;

    /// @notice Price to mint one NFT (in payment token units)
    uint256 public mintPrice;

    /// @notice Counter for token IDs (starts at 1)
    uint256 public nextTokenId;

    /// @notice Base URI for token metadata
    string private baseTokenURI;

    /// @notice Total revenue accumulated from minting
    uint256 public totalRevenue;

    // ============ Events ============

    /// @notice Emitted when an NFT is minted
    event NFTMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        uint256 price
    );

    /// @notice Emitted when the mint price is updated
    event MintPriceUpdated(
        uint256 oldPrice,
        uint256 newPrice
    );

    /// @notice Emitted when the base URI is updated
    event BaseURIUpdated(
        string newBaseURI
    );

    /// @notice Emitted when revenue is withdrawn
    event RevenueWithdrawn(
        address indexed owner,
        uint256 amount
    );

    // ============ Errors ============

    error InvalidTokenAddress();
    error ZeroPrice();
    error InsufficientPayment(uint256 required, uint256 provided);
    error TransferFailed();
    error InsufficientRevenue(uint256 requested, uint256 available);
    error SoulboundTransferNotAllowed();
    error ZeroAmount();

    // ============ Constructor ============

    /// @notice Initializes the NFT contract
    /// @param paymentToken_ The ERC20 token address for payments (USDC)
    /// @param mintPrice_ Initial price to mint one NFT
    /// @param initialBaseURI Initial base URI for metadata
    constructor(
        address paymentToken_,
        uint256 mintPrice_,
        string memory initialBaseURI
    ) ERC721("Trust Me Bro", "TMB") Ownable(msg.sender) {
        if (paymentToken_ == address(0)) {
            revert InvalidTokenAddress();
        }
        
        PAYMENT_TOKEN = IERC20(paymentToken_);
        mintPrice = mintPrice_;
        baseTokenURI = initialBaseURI;
        nextTokenId = 1; // Start token IDs at 1
    }

    // ============ Public Functions ============

    /**
     * @notice Mint a new NFT by paying with USDC
     * @dev Requires prior approval of payment token
     * @return tokenId The ID of the newly minted NFT
     */
    function mint() external whenNotPaused nonReentrant returns (uint256 tokenId) {
        if (mintPrice == 0) {
            revert ZeroPrice();
        }

        // Transfer payment from user to contract
        if (!PAYMENT_TOKEN.transferFrom(msg.sender, address(this), mintPrice)) {
            revert TransferFailed();
        }

        totalRevenue += mintPrice;
        tokenId = nextTokenId++;

        _safeMint(msg.sender, tokenId);

        emit NFTMinted(msg.sender, tokenId, mintPrice);
    }

    /**
     * @notice Check if an address owns any NFT
     * @param account The address to check
     * @return True if the address owns at least one NFT
     */
    function hasNft(address account) external view returns (bool) {
        return balanceOf(account) > 0;
    }

    // ============ Owner Functions ============

    /**
     * @notice Update the mint price
     * @param newPrice New price in payment token units
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }

    /**
     * @notice Update the base URI for token metadata
     * @param newBaseURI New base URI string
     */
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @notice Withdraw accumulated revenue
     * @param amount Amount to withdraw
     */
    function withdrawRevenue(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) {
            revert ZeroAmount();
        }
        
        uint256 balance = PAYMENT_TOKEN.balanceOf(address(this));
        if (amount > balance) {
            revert InsufficientRevenue(amount, balance);
        }

        if (!PAYMENT_TOKEN.transfer(owner(), amount)) {
            revert TransferFailed();
        }

        emit RevenueWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Pause minting
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause minting
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    /**
     * @notice Get the current contract revenue balance
     * @return The balance of payment tokens in the contract
     */
    function getRevenueBalance() external view returns (uint256) {
        return PAYMENT_TOKEN.balanceOf(address(this));
    }

    /**
     * @notice Get the total number of NFTs minted
     * @return The total supply (nextTokenId - 1)
     */
    function totalSupply() external view returns (uint256) {
        return nextTokenId - 1;
    }

    // ============ Internal Overrides ============

    /**
     * @notice Override _baseURI to return our configurable base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    /**
     * @notice Override _update to make tokens soulbound (non-transferable)
     * @dev Only allows minting (from = address(0)) and burning (to = address(0))
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        // Block all other transfers
        if (from != address(0) && to != address(0)) {
            revert SoulboundTransferNotAllowed();
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Override tokenURI to append token ID to base URI
     * @param tokenId The token ID to get URI for
     * @return The full token URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0
            ? string.concat(baseURI, tokenId.toString())
            : "";
    }
}

