// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {TrustMeBroNFT} from "../src/TrustMeBroNFT.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract TrustMeBroNFTTest is Test {
    TrustMeBroNFT public nft;
    ERC20Mock public usdc;

    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public unauthorized = address(0x3);

    uint256 public constant MINT_PRICE = 10 * 10**6; // 10 USDC (6 decimals)
    string public constant BASE_URI = "https://api.trustmebro.com/nft/";

    // Events for testing
    event NFTMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        uint256 price
    );

    event MintPriceUpdated(
        uint256 oldPrice,
        uint256 newPrice
    );

    event BaseURIUpdated(
        string newBaseURI
    );

    event RevenueWithdrawn(
        address indexed owner,
        uint256 amount
    );

    function setUp() public {
        // Deploy mock USDC token
        usdc = new ERC20Mock();
        
        // Deploy NFT contract
        nft = new TrustMeBroNFT(address(usdc), MINT_PRICE, BASE_URI);
        
        // Give users some USDC
        usdc.mint(user1, 1000 * 10**6); // 1000 USDC
        usdc.mint(user2, 1000 * 10**6); // 1000 USDC
    }

    // ============ Constructor Tests ============

    function test_Constructor_SetsCorrectName() public view {
        assertEq(nft.name(), "Trust Me Bro");
    }

    function test_Constructor_SetsCorrectSymbol() public view {
        assertEq(nft.symbol(), "TMB");
    }

    function test_Constructor_SetsCorrectPaymentToken() public view {
        assertEq(address(nft.PAYMENT_TOKEN()), address(usdc));
    }

    function test_Constructor_SetsCorrectMintPrice() public view {
        assertEq(nft.mintPrice(), MINT_PRICE);
    }

    function test_Constructor_SetsCorrectOwner() public view {
        assertEq(nft.owner(), owner);
    }

    function test_Constructor_StartsAtTokenId1() public view {
        assertEq(nft.nextTokenId(), 1);
    }

    function test_Constructor_InvalidToken_Reverts() public {
        vm.expectRevert(TrustMeBroNFT.InvalidTokenAddress.selector);
        new TrustMeBroNFT(address(0), MINT_PRICE, BASE_URI);
    }

    // ============ Mint Tests ============

    function test_Mint_Success() public {
        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE);
        
        vm.expectEmit(true, true, true, true);
        emit NFTMinted(user1, 1, MINT_PRICE);
        
        uint256 tokenId = nft.mint();
        vm.stopPrank();

        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), user1);
        assertEq(nft.balanceOf(user1), 1);
        assertEq(nft.totalSupply(), 1);
    }

    function test_Mint_TransfersPayment() public {
        uint256 balanceBefore = usdc.balanceOf(user1);
        
        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE);
        nft.mint();
        vm.stopPrank();

        assertEq(usdc.balanceOf(user1), balanceBefore - MINT_PRICE);
        assertEq(usdc.balanceOf(address(nft)), MINT_PRICE);
    }

    function test_Mint_UpdatesTotalRevenue() public {
        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE);
        nft.mint();
        vm.stopPrank();

        assertEq(nft.totalRevenue(), MINT_PRICE);
    }

    function test_Mint_MultipleMints_IncrementsTokenId() public {
        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE * 3);
        
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
        usdc.approve(address(nft), MINT_PRICE);
        vm.prank(user1);
        uint256 id1 = nft.mint();

        vm.prank(user2);
        usdc.approve(address(nft), MINT_PRICE);
        vm.prank(user2);
        uint256 id2 = nft.mint();

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(nft.ownerOf(1), user1);
        assertEq(nft.ownerOf(2), user2);
    }

    function test_Mint_WhenPaused_Reverts() public {
        nft.pause();

        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        nft.mint();
        vm.stopPrank();
    }

    function test_Mint_InsufficientApproval_Reverts() public {
        vm.startPrank(user1);
        // No approval
        vm.expectRevert();
        nft.mint();
        vm.stopPrank();
    }

    function test_Mint_InsufficientBalance_Reverts() public {
        address poorUser = address(0x999);
        
        vm.startPrank(poorUser);
        usdc.approve(address(nft), MINT_PRICE);
        vm.expectRevert();
        nft.mint();
        vm.stopPrank();
    }

    function test_Mint_ZeroPrice_Reverts() public {
        // Create NFT with zero price
        TrustMeBroNFT zeroNft = new TrustMeBroNFT(address(usdc), 0, BASE_URI);
        
        vm.prank(user1);
        vm.expectRevert(TrustMeBroNFT.ZeroPrice.selector);
        zeroNft.mint();
    }

    // ============ hasNft Tests ============

    function test_HasNft_ReturnsFalse_WhenNoNFT() public view {
        assertFalse(nft.hasNft(user1));
    }

    function test_HasNft_ReturnsTrue_WhenOwnsNFT() public {
        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE);
        nft.mint();
        vm.stopPrank();

        assertTrue(nft.hasNft(user1));
    }

    function test_HasNft_ReturnsTrue_WithMultipleNFTs() public {
        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE * 3);
        nft.mint();
        nft.mint();
        nft.mint();
        vm.stopPrank();

        assertTrue(nft.hasNft(user1));
        assertEq(nft.balanceOf(user1), 3);
    }

    // ============ Soulbound Tests ============

    function test_Transfer_NotAllowed() public {
        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE);
        uint256 tokenId = nft.mint();

        vm.expectRevert(TrustMeBroNFT.SoulboundTransferNotAllowed.selector);
        nft.transferFrom(user1, user2, tokenId);
        vm.stopPrank();
    }

    function test_SafeTransfer_NotAllowed() public {
        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE);
        uint256 tokenId = nft.mint();

        vm.expectRevert(TrustMeBroNFT.SoulboundTransferNotAllowed.selector);
        nft.safeTransferFrom(user1, user2, tokenId);
        vm.stopPrank();
    }

    function test_Approve_StillWorks_ButTransferFails() public {
        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE);
        uint256 tokenId = nft.mint();
        
        // Approval should work
        nft.approve(user2, tokenId);
        vm.stopPrank();

        // But transfer from approved address should fail
        vm.prank(user2);
        vm.expectRevert(TrustMeBroNFT.SoulboundTransferNotAllowed.selector);
        nft.transferFrom(user1, user2, tokenId);
    }

    // ============ setMintPrice Tests ============

    function test_SetMintPrice_Success() public {
        uint256 newPrice = 20 * 10**6; // 20 USDC
        
        vm.expectEmit(true, true, true, true);
        emit MintPriceUpdated(MINT_PRICE, newPrice);
        
        nft.setMintPrice(newPrice);

        assertEq(nft.mintPrice(), newPrice);
    }

    function test_SetMintPrice_ToZero() public {
        nft.setMintPrice(0);
        assertEq(nft.mintPrice(), 0);
    }

    function test_SetMintPrice_OnlyOwner() public {
        vm.prank(unauthorized);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", unauthorized));
        nft.setMintPrice(100);
    }

    function test_SetMintPrice_AffectsNewMints() public {
        uint256 newPrice = 5 * 10**6; // 5 USDC
        nft.setMintPrice(newPrice);

        uint256 balanceBefore = usdc.balanceOf(user1);

        vm.startPrank(user1);
        usdc.approve(address(nft), newPrice);
        nft.mint();
        vm.stopPrank();

        assertEq(usdc.balanceOf(user1), balanceBefore - newPrice);
    }

    // ============ setBaseURI Tests ============

    function test_SetBaseURI_Success() public {
        string memory newURI = "https://new.api.com/metadata/";
        
        vm.expectEmit(true, true, true, true);
        emit BaseURIUpdated(newURI);
        
        nft.setBaseURI(newURI);

        // Mint an NFT to test tokenURI
        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE);
        nft.mint();
        vm.stopPrank();

        assertEq(nft.tokenURI(1), "https://new.api.com/metadata/1");
    }

    function test_SetBaseURI_OnlyOwner() public {
        vm.prank(unauthorized);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", unauthorized));
        nft.setBaseURI("https://malicious.com/");
    }

    function test_SetBaseURI_EmptyString() public {
        nft.setBaseURI("");

        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE);
        nft.mint();
        vm.stopPrank();

        assertEq(nft.tokenURI(1), "");
    }

    // ============ tokenURI Tests ============

    function test_TokenURI_ReturnsCorrectURI() public {
        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE * 3);
        nft.mint(); // ID 1
        nft.mint(); // ID 2
        nft.mint(); // ID 3
        vm.stopPrank();

        assertEq(nft.tokenURI(1), "https://api.trustmebro.com/nft/1");
        assertEq(nft.tokenURI(2), "https://api.trustmebro.com/nft/2");
        assertEq(nft.tokenURI(3), "https://api.trustmebro.com/nft/3");
    }

    function test_TokenURI_NonexistentToken_Reverts() public {
        vm.expectRevert();
        nft.tokenURI(999);
    }

    // ============ withdrawRevenue Tests ============

    function test_WithdrawRevenue_Success() public {
        // Mint some NFTs to accumulate revenue
        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE * 2);
        nft.mint();
        nft.mint();
        vm.stopPrank();

        uint256 revenueBalance = nft.getRevenueBalance();
        uint256 ownerBalanceBefore = usdc.balanceOf(owner);

        vm.expectEmit(true, true, true, true);
        emit RevenueWithdrawn(owner, revenueBalance);
        
        nft.withdrawRevenue(revenueBalance);

        assertEq(usdc.balanceOf(owner), ownerBalanceBefore + revenueBalance);
        assertEq(nft.getRevenueBalance(), 0);
    }

    function test_WithdrawRevenue_PartialAmount() public {
        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE);
        nft.mint();
        vm.stopPrank();

        uint256 halfRevenue = MINT_PRICE / 2;
        nft.withdrawRevenue(halfRevenue);

        assertEq(nft.getRevenueBalance(), MINT_PRICE - halfRevenue);
    }

    function test_WithdrawRevenue_OnlyOwner() public {
        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE);
        nft.mint();
        vm.stopPrank();

        vm.prank(unauthorized);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", unauthorized));
        nft.withdrawRevenue(MINT_PRICE);
    }

    function test_WithdrawRevenue_ZeroAmount_Reverts() public {
        vm.expectRevert(TrustMeBroNFT.ZeroAmount.selector);
        nft.withdrawRevenue(0);
    }

    function test_WithdrawRevenue_InsufficientRevenue_Reverts() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                TrustMeBroNFT.InsufficientRevenue.selector,
                MINT_PRICE,
                0
            )
        );
        nft.withdrawRevenue(MINT_PRICE);
    }

    function test_WithdrawRevenue_ExceedsBalance_Reverts() public {
        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE);
        nft.mint();
        vm.stopPrank();

        uint256 balance = nft.getRevenueBalance();
        
        vm.expectRevert(
            abi.encodeWithSelector(
                TrustMeBroNFT.InsufficientRevenue.selector,
                balance + 1,
                balance
            )
        );
        nft.withdrawRevenue(balance + 1);
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

        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE);
        uint256 tokenId = nft.mint();
        vm.stopPrank();

        assertEq(tokenId, 1);
    }

    // ============ View Functions Tests ============

    function test_GetRevenueBalance() public {
        assertEq(nft.getRevenueBalance(), 0);

        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE);
        nft.mint();
        vm.stopPrank();

        assertEq(nft.getRevenueBalance(), MINT_PRICE);
    }

    function test_TotalSupply() public {
        assertEq(nft.totalSupply(), 0);

        vm.startPrank(user1);
        usdc.approve(address(nft), MINT_PRICE * 5);
        nft.mint();
        assertEq(nft.totalSupply(), 1);
        
        nft.mint();
        nft.mint();
        assertEq(nft.totalSupply(), 3);
        vm.stopPrank();
    }

    // ============ Fuzz Tests ============

    function testFuzz_Mint_AnyValidPrice(uint256 price) public {
        // Bound price to reasonable range (1 wei to 1M USDC)
        price = bound(price, 1, 1_000_000 * 10**6);
        
        // Create NFT with fuzzed price
        TrustMeBroNFT fuzzNft = new TrustMeBroNFT(address(usdc), price, BASE_URI);
        
        // Give user enough tokens
        usdc.mint(user1, price);

        vm.startPrank(user1);
        usdc.approve(address(fuzzNft), price);
        uint256 tokenId = fuzzNft.mint();
        vm.stopPrank();

        assertEq(tokenId, 1);
        assertEq(fuzzNft.ownerOf(1), user1);
        assertEq(fuzzNft.getRevenueBalance(), price);
    }

    function testFuzz_MultipleMints(uint8 numMints) public {
        // Bound to reasonable number
        numMints = uint8(bound(numMints, 1, 50));
        
        uint256 totalCost = uint256(numMints) * MINT_PRICE;
        usdc.mint(user1, totalCost);

        vm.startPrank(user1);
        usdc.approve(address(nft), totalCost);
        
        for (uint8 i = 0; i < numMints; i++) {
            nft.mint();
        }
        vm.stopPrank();

        assertEq(nft.totalSupply(), numMints);
        assertEq(nft.balanceOf(user1), numMints);
        assertEq(nft.getRevenueBalance(), totalCost);
    }

    function testFuzz_WithdrawPartialRevenue(uint256 withdrawAmount) public {
        // First accumulate some revenue
        uint256 totalMints = 10;
        uint256 totalRevenue = totalMints * MINT_PRICE;
        usdc.mint(user1, totalRevenue);

        vm.startPrank(user1);
        usdc.approve(address(nft), totalRevenue);
        for (uint256 i = 0; i < totalMints; i++) {
            nft.mint();
        }
        vm.stopPrank();

        // Bound withdraw amount
        withdrawAmount = bound(withdrawAmount, 1, totalRevenue);
        
        uint256 ownerBalanceBefore = usdc.balanceOf(owner);
        nft.withdrawRevenue(withdrawAmount);

        assertEq(usdc.balanceOf(owner), ownerBalanceBefore + withdrawAmount);
        assertEq(nft.getRevenueBalance(), totalRevenue - withdrawAmount);
    }
}

