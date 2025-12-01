// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title TrustMeBroNFT
 * @notice A free soulbound ERC721 NFT for game access with dynamic metadata
 * @dev Soulbound implementation - tokens cannot be transferred after minting
 */
contract TrustMeBroNFT is ERC721, Ownable, Pausable {
    using Strings for uint256;

    // ============ State Variables ============

    /// @notice Counter for token IDs (starts at 1)
    uint256 public nextTokenId;

    /// @notice Base URI for token metadata
    string private baseTokenURI;

    // ============ Events ============

    /// @notice Emitted when an NFT is minted
    event NFTMinted(
        address indexed recipient,
        uint256 indexed tokenId
    );

    /// @notice Emitted when the base URI is updated
    event BaseURIUpdated(
        string newBaseURI
    );

    // ============ Errors ============

    error SoulboundTransferNotAllowed();

    // ============ Constructor ============

    /// @notice Initializes the NFT contract
    /// @param initialBaseURI Initial base URI for metadata
    constructor(
        string memory initialBaseURI
    ) ERC721("Trust Me Bro", "TMB") Ownable(msg.sender) {
        baseTokenURI = initialBaseURI;
        nextTokenId = 1; // Start token IDs at 1
    }

    // ============ Public Functions ============

    /**
     * @notice Mint a new NFT for free
     * @return tokenId The ID of the newly minted NFT
     */
    function mint() external whenNotPaused returns (uint256 tokenId) {
        tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);
        emit NFTMinted(msg.sender, tokenId);
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
     * @notice Update the base URI for token metadata
     * @param newBaseURI New base URI string
     */
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
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
     * @notice Override tokenURI to return dynamic position-based URI
     * @param tokenId The token ID to get URI for
     * @return The full token URI with position (tokenId - 1)
     * @dev Token ID 1 maps to position 0, Token ID 2 maps to position 1, etc.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        string memory baseURI = _baseURI();
        if (bytes(baseURI).length == 0) {
            return "";
        }
        
        // Position starts at 0, token IDs start at 1
        uint256 position = tokenId - 1;
        return string.concat(baseURI, position.toString());
    }
}
