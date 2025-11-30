// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {MultiplierGame} from "../src/MultiplierGame.sol";

contract MultiplierGameTest is Test {
    MultiplierGame public game;

    address public owner = address(this);
    address public player = address(0x1);
    address public backend = address(0x2);
    address public unauthorized = address(0x3);

    uint256 public constant INITIAL_POT = 100 ether;

    // Allow test contract to receive ETH for fee withdrawal tests
    receive() external payable {}

    // Events for testing
    event GameCreated(
        bytes32 preliminaryGameId,
        uint256 indexed onChainGameId,
        address indexed player,
        uint256 betAmount,
        bytes32 commitmentHash
    );

    event PayoutSent(
        uint256 indexed onChainGameId,
        uint256 amount,
        address indexed recipient
    );

    event GameStatusUpdated(
        uint256 indexed onChainGameId,
        MultiplierGame.Status status
    );

    function setUp() public {
        game = new MultiplierGame();
        
        // Fund the pot
        game.refillPot{value: INITIAL_POT}();
        
        // Authorize backend
        game.setBackend(backend, true);
        
        // Give player some ETH
        vm.deal(player, 10 ether);
    }

    // ============ Helper Functions ============

    /// @notice Create a commitment from seed and payout amount
    /// @dev commitment = keccak256(abi.encodePacked(seed, payoutAmount))
    function _createCommitment(bytes32 seed, uint256 payoutAmount) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(seed, payoutAmount));
    }

    /// @notice Helper to create a game with a specific seed and payout
    function _createGameWithPayout(
        address _player,
        uint256 betAmount,
        bytes32 preliminaryId,
        bytes32 seed,
        uint256 payoutAmount
    ) internal returns (uint256 gameId) {
        bytes32 commitment = _createCommitment(seed, payoutAmount);
        
        vm.prank(_player);
        gameId = game.createGame{value: betAmount}(preliminaryId, commitment);
    }

    // ============ createGame Tests ============

    function test_CreateGame_Success() public {
        bytes32 preliminaryId = bytes32("game-123");
        bytes32 seed = keccak256("secret-seed");
        uint256 payoutAmount = 1 ether;
        bytes32 commitment = _createCommitment(seed, payoutAmount);
        uint256 betAmount = 0.5 ether;

        vm.expectEmit(true, true, true, true);
        emit GameCreated(preliminaryId, 0, player, betAmount, commitment);

        vm.prank(player);
        uint256 gameId = game.createGame{value: betAmount}(preliminaryId, commitment);

        assertEq(gameId, 0);

        MultiplierGame.Game memory gameData = game.getGame(gameId);
        assertEq(gameData.player, player);
        assertEq(gameData.betAmount, betAmount);
        assertEq(gameData.commitmentHash, commitment);
        assertEq(uint8(gameData.status), uint8(MultiplierGame.Status.CREATED));
        assertEq(gameData.preliminaryGameId, preliminaryId);
        assertEq(gameData.createdAt, block.timestamp);
    }

    function test_CreateGame_ExceedsMaxBet_Reverts() public {
        // Max bet is 1% of pot = 1 ether
        uint256 maxBet = game.getMaxBet();
        uint256 excessiveBet = maxBet + 1;

        bytes32 seed = keccak256("seed");
        bytes32 commitment = _createCommitment(seed, 1 ether);

        vm.prank(player);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.BetExceedsMaxBet.selector,
                excessiveBet,
                maxBet
            )
        );
        game.createGame{value: excessiveBet}(bytes32("id"), commitment);
    }

    function test_CreateGame_ZeroBet_Reverts() public {
        bytes32 seed = keccak256("seed");
        bytes32 commitment = _createCommitment(seed, 1 ether);

        vm.prank(player);
        vm.expectRevert(MultiplierGame.ZeroBet.selector);
        game.createGame{value: 0}(bytes32("id"), commitment);
    }

    function test_CreateGame_IncrementGameId() public {
        bytes32 seed = keccak256("seed");
        bytes32 commitment = _createCommitment(seed, 1 ether);

        vm.startPrank(player);
        
        uint256 id1 = game.createGame{value: 0.1 ether}(bytes32("1"), commitment);
        uint256 id2 = game.createGame{value: 0.1 ether}(bytes32("2"), commitment);
        uint256 id3 = game.createGame{value: 0.1 ether}(bytes32("3"), commitment);
        
        vm.stopPrank();

        assertEq(id1, 0);
        assertEq(id2, 1);
        assertEq(id3, 2);
    }

    // ============ cashOut Tests ============

    function test_CashOut_ValidReveal_Success() public {
        bytes32 seed = keccak256("my-secret-seed");
        uint256 betAmount = 0.5 ether;
        uint256 payoutAmount = 1 ether; // 2x multiplier
        
        uint256 gameId = _createGameWithPayout(player, betAmount, bytes32("game-1"), seed, payoutAmount);

        uint256 houseFee = (payoutAmount * 500) / 10000; // 5% = 0.05 ether
        uint256 expectedPlayerPayout = payoutAmount - houseFee;

        uint256 playerBalanceBefore = player.balance;

        vm.prank(player);
        game.cashOut(gameId, payoutAmount, seed);

        MultiplierGame.Game memory gameData = game.getGame(gameId);
        assertEq(uint8(gameData.status), uint8(MultiplierGame.Status.CASHED_OUT));
        assertEq(gameData.seed, seed);

        uint256 playerBalanceAfter = player.balance;
        assertEq(playerBalanceAfter - playerBalanceBefore, expectedPlayerPayout);

        // Verify house fee accumulated
        assertEq(game.ownerFees(), houseFee);
    }

    function test_CashOut_WrongPayoutAmount_Reverts() public {
        bytes32 seed = keccak256("my-secret-seed");
        uint256 committedPayout = 1 ether;
        uint256 claimedPayout = 2 ether; // Trying to claim more than committed
        
        uint256 gameId = _createGameWithPayout(player, 0.5 ether, bytes32("game-1"), seed, committedPayout);

        // The hash won't match because payout is different
        bytes32 wrongCommitment = keccak256(abi.encodePacked(seed, claimedPayout));
        bytes32 expectedCommitment = keccak256(abi.encodePacked(seed, committedPayout));

        vm.prank(player);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.InvalidReveal.selector,
                wrongCommitment,
                expectedCommitment
            )
        );
        game.cashOut(gameId, claimedPayout, seed);
    }

    function test_CashOut_WrongSeed_Reverts() public {
        bytes32 correctSeed = keccak256("correct-seed");
        bytes32 wrongSeed = keccak256("wrong-seed");
        uint256 payoutAmount = 1 ether;
        
        uint256 gameId = _createGameWithPayout(player, 0.5 ether, bytes32("game-1"), correctSeed, payoutAmount);

        bytes32 wrongCommitment = keccak256(abi.encodePacked(wrongSeed, payoutAmount));
        bytes32 expectedCommitment = keccak256(abi.encodePacked(correctSeed, payoutAmount));

        vm.prank(player);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.InvalidReveal.selector,
                wrongCommitment,
                expectedCommitment
            )
        );
        game.cashOut(gameId, payoutAmount, wrongSeed);
    }

    function test_CashOut_ExceedsMaxPayout_Reverts() public {
        bytes32 seed = keccak256("seed");
        // Use a payout that will definitely exceed max even after bet is added to pot
        // Max payout is 5% of pot. With 100 ether pot + 0.5 ether bet = 100.5 ether
        // Max payout = 5.025 ether, so use 6 ether to be safe
        uint256 excessivePayout = 6 ether;
        
        // Backend commits to an excessive payout (mistake or attack)
        uint256 gameId = _createGameWithPayout(player, 0.5 ether, bytes32("game-1"), seed, excessivePayout);

        uint256 maxPayout = game.getMaxPayout(); // Get max payout AFTER game creation

        vm.prank(player);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.PayoutExceedsMaxPayout.selector,
                excessivePayout,
                maxPayout
            )
        );
        game.cashOut(gameId, excessivePayout, seed);
    }

    function test_CashOut_NotPlayer_Reverts() public {
        bytes32 seed = keccak256("seed");
        uint256 payoutAmount = 1 ether;
        
        uint256 gameId = _createGameWithPayout(player, 0.5 ether, bytes32("game-1"), seed, payoutAmount);

        vm.prank(unauthorized);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.NotGamePlayer.selector,
                unauthorized,
                player
            )
        );
        game.cashOut(gameId, payoutAmount, seed);
    }

    function test_CashOut_AlreadyCashedOut_Reverts() public {
        bytes32 seed = keccak256("seed");
        uint256 payoutAmount = 1 ether;
        
        uint256 gameId = _createGameWithPayout(player, 0.5 ether, bytes32("game-1"), seed, payoutAmount);

        vm.startPrank(player);
        game.cashOut(gameId, payoutAmount, seed);

        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.GameNotInCreatedStatus.selector,
                gameId,
                MultiplierGame.Status.CASHED_OUT
            )
        );
        game.cashOut(gameId, payoutAmount, seed);
        vm.stopPrank();
    }

    function test_CashOut_GameMarkedLost_Reverts() public {
        bytes32 seed = keccak256("seed");
        uint256 payoutAmount = 1 ether;
        
        uint256 gameId = _createGameWithPayout(player, 0.5 ether, bytes32("game-1"), seed, payoutAmount);

        // Backend marks game as lost
        vm.prank(backend);
        game.markGameAsLost(gameId, seed);

        vm.prank(player);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.GameNotInCreatedStatus.selector,
                gameId,
                MultiplierGame.Status.LOST
            )
        );
        game.cashOut(gameId, payoutAmount, seed);
    }

    // ============ markGameAsLost Tests ============

    function test_MarkGameAsLost_Backend_Success() public {
        bytes32 seed = keccak256("seed");
        uint256 gameId = _createGameWithPayout(player, 0.5 ether, bytes32("game-1"), seed, 1 ether);

        vm.expectEmit(true, true, true, true);
        emit GameStatusUpdated(gameId, MultiplierGame.Status.LOST);

        vm.prank(backend);
        game.markGameAsLost(gameId, seed);

        MultiplierGame.Game memory gameData = game.getGame(gameId);
        assertEq(uint8(gameData.status), uint8(MultiplierGame.Status.LOST));
        assertEq(gameData.seed, seed);
    }

    function test_MarkGameAsLost_Unauthorized_Reverts() public {
        bytes32 seed = keccak256("seed");
        uint256 gameId = _createGameWithPayout(player, 0.5 ether, bytes32("game-1"), seed, 1 ether);

        vm.prank(unauthorized);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.UnauthorizedBackend.selector,
                unauthorized
            )
        );
        game.markGameAsLost(gameId, seed);
    }

    function test_MarkGameAsLost_AlreadyCashedOut_Reverts() public {
        bytes32 seed = keccak256("seed");
        uint256 payoutAmount = 1 ether;
        uint256 gameId = _createGameWithPayout(player, 0.5 ether, bytes32("game-1"), seed, payoutAmount);

        // Player cashes out
        vm.prank(player);
        game.cashOut(gameId, payoutAmount, seed);

        vm.prank(backend);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.GameNotInCreatedStatus.selector,
                gameId,
                MultiplierGame.Status.CASHED_OUT
            )
        );
        game.markGameAsLost(gameId, seed);
    }

    // ============ Pause Tests ============

    function test_Pause_BlocksGameCreation() public {
        game.pause();

        bytes32 seed = keccak256("seed");
        bytes32 commitment = _createCommitment(seed, 1 ether);

        vm.prank(player);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        game.createGame{value: 0.5 ether}(bytes32("id"), commitment);
    }

    function test_Unpause_AllowsGameCreation() public {
        game.pause();
        game.unpause();

        bytes32 seed = keccak256("seed");
        bytes32 commitment = _createCommitment(seed, 1 ether);

        vm.prank(player);
        uint256 gameId = game.createGame{value: 0.5 ether}(bytes32("id"), commitment);

        assertEq(gameId, 0);
    }

    function test_Pause_OnlyOwner() public {
        vm.prank(unauthorized);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", unauthorized));
        game.pause();
    }

    // ============ Owner Functions Tests ============

    function test_SetBackend_Success() public {
        address newBackend = address(0x999);
        
        game.setBackend(newBackend, true);
        assertTrue(game.authorizedBackends(newBackend));

        game.setBackend(newBackend, false);
        assertFalse(game.authorizedBackends(newBackend));
    }

    function test_SetBackend_OnlyOwner() public {
        vm.prank(unauthorized);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", unauthorized));
        game.setBackend(address(0x999), true);
    }

    function test_RefillPot_Success() public {
        uint256 potBefore = game.getPotBalance();
        uint256 refillAmount = 50 ether;

        game.refillPot{value: refillAmount}();

        assertEq(game.getPotBalance(), potBefore + refillAmount);
    }

    function test_WithdrawFees_Success() public {
        // Create and cash out a game to accumulate fees
        bytes32 seed = keccak256("seed");
        uint256 payoutAmount = 2 ether;
        uint256 gameId = _createGameWithPayout(player, 0.5 ether, bytes32("game-1"), seed, payoutAmount);

        vm.prank(player);
        game.cashOut(gameId, payoutAmount, seed);

        uint256 accumulatedFees = game.ownerFees();
        assertTrue(accumulatedFees > 0);

        uint256 ownerBalanceBefore = owner.balance;

        game.withdrawFees(accumulatedFees);

        assertEq(game.ownerFees(), 0);
        assertEq(owner.balance - ownerBalanceBefore, accumulatedFees);
    }

    function test_WithdrawFees_InsufficientFees_Reverts() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.InsufficientFees.selector,
                1 ether,
                0
            )
        );
        game.withdrawFees(1 ether);
    }

    // ============ View Functions Tests ============

    function test_GetPotBalance() public view {
        assertEq(game.getPotBalance(), INITIAL_POT);
    }

    function test_GetMaxBet() public view {
        // 1% of 100 ether = 1 ether
        assertEq(game.getMaxBet(), 1 ether);
    }

    function test_GetMaxPayout() public view {
        // 5% of 100 ether = 5 ether
        assertEq(game.getMaxPayout(), 5 ether);
    }

    // ============ Receive Function Test ============

    function test_ReceiveEther() public {
        uint256 potBefore = game.getPotBalance();
        
        (bool success, ) = address(game).call{value: 1 ether}("");
        assertTrue(success);

        assertEq(game.getPotBalance(), potBefore + 1 ether);
    }

    // ============ Fuzz Tests ============

    function testFuzz_CreateGame_BetWithinLimits(uint256 betAmount) public {
        uint256 maxBet = game.getMaxBet();
        betAmount = bound(betAmount, 1, maxBet);

        vm.deal(player, betAmount);

        bytes32 seed = keccak256("fuzz-seed");
        bytes32 commitment = _createCommitment(seed, 1 ether);

        vm.prank(player);
        uint256 gameId = game.createGame{value: betAmount}(bytes32("fuzz-game"), commitment);

        MultiplierGame.Game memory gameData = game.getGame(gameId);
        assertEq(gameData.betAmount, betAmount);
        assertEq(gameData.player, player);
    }

    function testFuzz_CashOut_PayoutCalculation(uint256 payoutAmount) public {
        uint256 maxPayout = game.getMaxPayout();
        payoutAmount = bound(payoutAmount, 1, maxPayout);

        bytes32 seed = keccak256("fuzz-seed");
        uint256 gameId = _createGameWithPayout(player, 0.5 ether, bytes32("fuzz-game"), seed, payoutAmount);

        uint256 expectedHouseFee = (payoutAmount * 500) / 10000;
        uint256 expectedPlayerPayout = payoutAmount - expectedHouseFee;

        uint256 playerBalanceBefore = player.balance;
        uint256 feesBefore = game.ownerFees();

        vm.prank(player);
        game.cashOut(gameId, payoutAmount, seed);

        assertEq(player.balance - playerBalanceBefore, expectedPlayerPayout);
        assertEq(game.ownerFees() - feesBefore, expectedHouseFee);
    }

    /// @notice Test that player cannot claim a different payout than committed
    function testFuzz_CashOut_CannotClaimDifferentPayout(uint256 committedPayout, uint256 claimedPayout) public {
        uint256 maxPayout = game.getMaxPayout();
        committedPayout = bound(committedPayout, 1, maxPayout);
        claimedPayout = bound(claimedPayout, 1, maxPayout);
        
        // Skip if they happen to be equal
        vm.assume(committedPayout != claimedPayout);

        bytes32 seed = keccak256("fuzz-seed");
        uint256 gameId = _createGameWithPayout(player, 0.5 ether, bytes32("fuzz-game"), seed, committedPayout);

        vm.prank(player);
        vm.expectRevert(); // Will revert with InvalidReveal
        game.cashOut(gameId, claimedPayout, seed);
    }
}

// ============ Reentrancy Attack Contract ============

contract ReentrancyAttacker {
    MultiplierGame public target;
    uint256 public attackGameId;
    bytes32 public attackSeed;
    uint256 public attackPayout;
    uint256 public attackCount;

    constructor(address _target) {
        target = MultiplierGame(payable(_target));
    }

    function attack(uint256 gameId, uint256 payoutAmount, bytes32 seed) external {
        attackGameId = gameId;
        attackSeed = seed;
        attackPayout = payoutAmount;
        attackCount = 0;
        target.cashOut(gameId, payoutAmount, seed);
    }

    receive() external payable {
        if (attackCount < 3) {
            attackCount++;
            try target.cashOut(attackGameId, attackPayout, attackSeed) {
                // If this succeeds, reentrancy guard failed
            } catch {
                // Expected: reentrancy should be blocked
            }
        }
    }
}

contract ReentrancyGuardTest is Test {
    MultiplierGame public game;
    ReentrancyAttacker public attacker;

    function setUp() public {
        game = new MultiplierGame();
        game.refillPot{value: 100 ether}();
        
        attacker = new ReentrancyAttacker(address(game));
        vm.deal(address(attacker), 10 ether);
    }

    function test_ReentrancyGuard() public {
        // Create a game with attacker as player
        bytes32 seed = keccak256("attacker-seed");
        uint256 payoutAmount = 1 ether;
        bytes32 commitment = keccak256(abi.encodePacked(seed, payoutAmount));

        vm.prank(address(attacker));
        uint256 gameId = game.createGame{value: 0.5 ether}(bytes32("attack-game"), commitment);

        // Attempt reentrancy attack
        vm.prank(address(attacker));
        attacker.attack(gameId, payoutAmount, seed);

        // Verify game was only cashed out once
        MultiplierGame.Game memory gameData = game.getGame(gameId);
        assertEq(uint8(gameData.status), uint8(MultiplierGame.Status.CASHED_OUT));
    }
}
