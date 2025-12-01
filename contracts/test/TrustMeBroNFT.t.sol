// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {TrustMeBroNFT} from "../src/TrustMeBroNFT.sol";

contract TrustMeBroNFTTest is Test {
    TrustMeBroNFT public nft;

    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public unauthorized = address(0x3);

    string public constant BASE_URI = "https://trustmebro-tan.vercel.app/api/nft/";

    // Events for testing
    event NFTMinted(
        address indexed recipient,
        uint256 indexed tokenId
    );

    event BaseURIUpdated(
        string newBaseURI
    );

    function setUp() public {
        // Deploy NFT contract
        nft = new TrustMeBroNFT(BASE_URI);
    }

    // ============ Constructor Tests ============

    function test_Constructor_SetsCorrectName() public view {
        assertEq(nft.name(), "Trust Me Bro");
    }

    function test_Constructor_SetsCorrectSymbol() public view {
        assertEq(nft.symbol(), "TMB");
    }

    function test_Constructor_SetsCorrectOwner() public view {
        assertEq(nft.owner(), owner);
    }

    function test_Constructor_StartsAtTokenId1() public view {
        assertEq(nft.nextTokenId(), 1);
    }

    // ============ Mint Tests ============

    function test_Mint_Success() public {
        vm.prank(user1);
        
        vm.expectEmit(true, true, true, true);
        emit NFTMinted(user1, 1);
        
        uint256 tokenId = nft.mint();

        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), user1);
        assertEq(nft.balanceOf(user1), 1);
        assertEq(nft.totalSupply(), 1);
    }

    function test_Mint_MultipleMints_IncrementsTokenId() public {
        vm.startPrank(user1);
        
        uint256 id1 = nft.mint();
        uint256 id2 = nft.mint();
        uint256 id3 = nft.mint();
        
        vm.stopPrank();

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(id3, 3);
        assertEq(nft.balanceOf(user1), 3);
        assertEq(nft.totalSupply(), 3);
    }

    function test_Mint_DifferentUsers() public {
        vm.prank(user1);
        uint256 id1 = nft.mint();

        vm.prank(user2);
        uint256 id2 = nft.mint();

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(nft.ownerOf(1), user1);
        assertEq(nft.ownerOf(2), user2);
    }

    function test_Mint_WhenPaused_Reverts() public {
        nft.pause();

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        nft.mint();
    }

    // ============ hasNft Tests ============

    function test_HasNft_ReturnsFalse_WhenNoNFT() public view {
        assertFalse(nft.hasNft(user1));
    }

    function test_HasNft_ReturnsTrue_WhenOwnsNFT() public {
        vm.prank(user1);
        nft.mint();

        assertTrue(nft.hasNft(user1));
    }

    function test_HasNft_ReturnsTrue_WithMultipleNFTs() public {
        vm.startPrank(user1);
        nft.mint();
        nft.mint();
        nft.mint();
        vm.stopPrank();

        assertTrue(nft.hasNft(user1));
        assertEq(nft.balanceOf(user1), 3);
    }

    // ============ Soulbound Tests ============

    function test_Transfer_NotAllowed() public {
        vm.prank(user1);
        uint256 tokenId = nft.mint();

        vm.prank(user1);
        vm.expectRevert(TrustMeBroNFT.SoulboundTransferNotAllowed.selector);
        nft.transferFrom(user1, user2, tokenId);
    }

    function test_SafeTransfer_NotAllowed() public {
        vm.prank(user1);
        uint256 tokenId = nft.mint();

        vm.prank(user1);
        vm.expectRevert(TrustMeBroNFT.SoulboundTransferNotAllowed.selector);
        nft.safeTransferFrom(user1, user2, tokenId);
    }

    function test_Approve_StillWorks_ButTransferFails() public {
        vm.startPrank(user1);
        uint256 tokenId = nft.mint();
        
        // Approval should work
        nft.approve(user2, tokenId);
        vm.stopPrank();

        // But transfer from approved address should fail
        vm.prank(user2);
        vm.expectRevert(TrustMeBroNFT.SoulboundTransferNotAllowed.selector);
        nft.transferFrom(user1, user2, tokenId);
    }

    // ============ setBaseURI Tests ============

    function test_SetBaseURI_Success() public {
        string memory newURI = "https://new.api.com/metadata/";
        
        vm.expectEmit(true, true, true, true);
        emit BaseURIUpdated(newURI);
        
        nft.setBaseURI(newURI);

        // Mint an NFT to test tokenURI
        vm.prank(user1);
        nft.mint();

        assertEq(nft.tokenURI(1), "https://new.api.com/metadata/0");
    }

    function test_SetBaseURI_OnlyOwner() public {
        vm.prank(unauthorized);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", unauthorized));
        nft.setBaseURI("https://malicious.com/");
    }

    function test_SetBaseURI_EmptyString() public {
        nft.setBaseURI("");

        vm.prank(user1);
        nft.mint();

        assertEq(nft.tokenURI(1), "");
    }

    // ============ tokenURI Tests ============

    function test_TokenURI_ReturnsCorrectURI_WithPositionStartingAtZero() public {
        vm.startPrank(user1);
        nft.mint(); // ID 1
        nft.mint(); // ID 2
        nft.mint(); // ID 3
        vm.stopPrank();

        // Token ID 1 should map to position 0
        assertEq(nft.tokenURI(1), "https://trustmebro-tan.vercel.app/api/nft/0");
        // Token ID 2 should map to position 1
        assertEq(nft.tokenURI(2), "https://trustmebro-tan.vercel.app/api/nft/1");
        // Token ID 3 should map to position 2
        assertEq(nft.tokenURI(3), "https://trustmebro-tan.vercel.app/api/nft/2");
    }

    function test_TokenURI_NonexistentToken_Reverts() public {
        vm.expectRevert();
        nft.tokenURI(999);
    }

    // ============ Pause/Unpause Tests ============

    function test_Pause_Success() public {
        nft.pause();
        assertTrue(nft.paused());
    }

    function test_Pause_OnlyOwner() public {
        vm.prank(unauthorized);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", unauthorized));
        nft.pause();
    }

    function test_Unpause_Success() public {
        nft.pause();
        nft.unpause();
        assertFalse(nft.paused());
    }

    function test_Unpause_OnlyOwner() public {
        nft.pause();
        
        vm.prank(unauthorized);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", unauthorized));
        nft.unpause();
    }

    function test_Unpause_AllowsMinting() public {
        nft.pause();
        nft.unpause();

        vm.prank(user1);
        uint256 tokenId = nft.mint();

        assertEq(tokenId, 1);
    }

    // ============ View Functions Tests ============

    function test_TotalSupply() public {
        assertEq(nft.totalSupply(), 0);

        vm.startPrank(user1);
        nft.mint();
        assertEq(nft.totalSupply(), 1);
        
        nft.mint();
        nft.mint();
        assertEq(nft.totalSupply(), 3);
        vm.stopPrank();
    }

    // ============ Fuzz Tests ============

    function testFuzz_MultipleMints(uint8 numMints) public {
        // Bound to reasonable number
        numMints = uint8(bound(numMints, 1, 50));

        vm.startPrank(user1);
        for (uint8 i = 0; i < numMints; i++) {
            nft.mint();
        }
        vm.stopPrank();

        assertEq(nft.totalSupply(), numMints);
        assertEq(nft.balanceOf(user1), numMints);
    }

    function testFuzz_TokenURI_PositionMapping(uint256 tokenId) public {
        // Bound token ID to reasonable range
        tokenId = bound(tokenId, 1, 1000);

        // Mint enough NFTs
        vm.startPrank(user1);
        for (uint256 i = 0; i < tokenId; i++) {
            nft.mint();
        }
        vm.stopPrank();

        // Calculate expected position (tokenId - 1)
        uint256 expectedPosition = tokenId - 1;
        string memory expectedURI = string.concat(BASE_URI, vm.toString(expectedPosition));
        
        assertEq(nft.tokenURI(tokenId), expectedURI);
    }
}
