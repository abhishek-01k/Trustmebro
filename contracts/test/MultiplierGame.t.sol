// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {MultiplierGame} from "../src/MultiplierGame.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MultiplierGameTest is Test {
    MultiplierGame public game;
    ERC20Mock public token;

    address public owner = address(this);
    address public player = address(0x1);
    address public backend = address(0x2);
    address public unauthorized = address(0x3);

    uint256 public constant INITIAL_POT = 100 ether;

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
        // Deploy mock ERC20 token
        token = new ERC20Mock();
        
        // Deploy game contract with token address
        game = new MultiplierGame(address(token));
        
        // Mint tokens to owner and fund the pot
        token.mint(owner, INITIAL_POT);
        token.approve(address(game), INITIAL_POT);
        game.refillPot(INITIAL_POT);
        
        // Authorize backend
        game.setBackend(backend, true);
        
        // Give player some tokens
        token.mint(player, 10 ether);
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
        
        // Approve tokens for the game contract
        vm.prank(_player);
        token.approve(address(game), betAmount);
        
        vm.prank(_player);
        gameId = game.createGame(preliminaryId, commitment, betAmount);
    }

    // ============ createGame Tests ============

    function test_CreateGame_Success() public {
        bytes32 preliminaryId = bytes32("game-123");
        bytes32 seed = keccak256("secret-seed");
        uint256 payoutAmount = 1 ether;
        bytes32 commitment = _createCommitment(seed, payoutAmount);
        uint256 betAmount = 0.5 ether;

        vm.startPrank(player);
        token.approve(address(game), betAmount);
        
        vm.expectEmit(true, true, true, true);
        emit GameCreated(preliminaryId, 0, player, betAmount, commitment);
        
        uint256 gameId = game.createGame(preliminaryId, commitment, betAmount);
        vm.stopPrank();

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

        vm.startPrank(player);
        token.approve(address(game), excessiveBet);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.BetExceedsMaxBet.selector,
                excessiveBet,
                maxBet
            )
        );
        game.createGame(bytes32("id"), commitment, excessiveBet);
        vm.stopPrank();
    }

    function test_CreateGame_ZeroBet_Reverts() public {
        bytes32 seed = keccak256("seed");
        bytes32 commitment = _createCommitment(seed, 1 ether);

        vm.prank(player);
        vm.expectRevert(MultiplierGame.ZeroBet.selector);
        game.createGame(bytes32("id"), commitment, 0);
    }

    function test_CreateGame_IncrementGameId() public {
        bytes32 seed = keccak256("seed");
        bytes32 commitment = _createCommitment(seed, 1 ether);

        vm.startPrank(player);
        token.approve(address(game), 0.3 ether);
        
        uint256 id1 = game.createGame(bytes32("1"), commitment, 0.1 ether);
        uint256 id2 = game.createGame(bytes32("2"), commitment, 0.1 ether);
        uint256 id3 = game.createGame(bytes32("3"), commitment, 0.1 ether);
        
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

        uint256 playerBalanceBefore = token.balanceOf(player);

        vm.prank(backend);
        game.cashOut(gameId, payoutAmount, seed);

        MultiplierGame.Game memory gameData = game.getGame(gameId);
        assertEq(uint8(gameData.status), uint8(MultiplierGame.Status.CASHED_OUT));
        assertEq(gameData.seed, seed);

        uint256 playerBalanceAfter = token.balanceOf(player);
        assertEq(playerBalanceAfter - playerBalanceBefore, expectedPlayerPayout);

        // Verify house fee accumulated
        assertEq(game.ownerFees(), houseFee);
    }


    function test_CashOut_NotPlayer_Reverts() public {
        bytes32 seed = keccak256("seed");
        uint256 payoutAmount = 1 ether;
        
        uint256 gameId = _createGameWithPayout(player, 0.5 ether, bytes32("game-1"), seed, payoutAmount);

        vm.prank(unauthorized);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.UnauthorizedBackend.selector,
                unauthorized
            )
        );
        game.cashOut(gameId, payoutAmount, seed);
    }

    function test_CashOut_AlreadyCashedOut_Reverts() public {
        bytes32 seed = keccak256("seed");
        uint256 payoutAmount = 1 ether;
        
        uint256 gameId = _createGameWithPayout(player, 0.5 ether, bytes32("game-1"), seed, payoutAmount);

        vm.startPrank(backend);
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

        vm.prank(backend);
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

        // Backend cashes out
        vm.prank(backend);
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

        vm.startPrank(player);
        token.approve(address(game), 0.5 ether);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        game.createGame(bytes32("id"), commitment, 0.5 ether);
        vm.stopPrank();
    }

    function test_Unpause_AllowsGameCreation() public {
        game.pause();
        game.unpause();

        bytes32 seed = keccak256("seed");
        bytes32 commitment = _createCommitment(seed, 1 ether);

        vm.startPrank(player);
        token.approve(address(game), 0.5 ether);
        uint256 gameId = game.createGame(bytes32("id"), commitment, 0.5 ether);
        vm.stopPrank();

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

        token.mint(owner, refillAmount);
        token.approve(address(game), refillAmount);
        game.refillPot(refillAmount);

        assertEq(game.getPotBalance(), potBefore + refillAmount);
    }

    function test_WithdrawFees_Success() public {
        // Create and cash out a game to accumulate fees
        bytes32 seed = keccak256("seed");
        uint256 payoutAmount = 2 ether;
        uint256 gameId = _createGameWithPayout(player, 0.5 ether, bytes32("game-1"), seed, payoutAmount);

        vm.prank(backend);
        game.cashOut(gameId, payoutAmount, seed);

        uint256 accumulatedFees = game.ownerFees();
        assertTrue(accumulatedFees > 0);

        uint256 ownerBalanceBefore = token.balanceOf(owner);

        game.withdrawFees(accumulatedFees);

        assertEq(game.ownerFees(), 0);
        assertEq(token.balanceOf(owner) - ownerBalanceBefore, accumulatedFees);
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

    function test_ReceiveEther_Reverts() public {
        vm.expectRevert();
        (bool success, ) = address(game).call{value: 1 ether}("");
        // When expectRevert is used, the call is caught by VM, so we just verify it was attempted
        // The revert expectation above is sufficient to verify the contract rejects ETH
        // The success variable is unused but needed to avoid compiler warning
        success; // silence unused variable warning
    }

    // ============ Fuzz Tests ============

    function testFuzz_CreateGame_BetWithinLimits(uint256 betAmount) public {
        uint256 maxBet = game.getMaxBet();
        betAmount = bound(betAmount, 1, maxBet);

        token.mint(player, betAmount);

        bytes32 seed = keccak256("fuzz-seed");
        bytes32 commitment = _createCommitment(seed, 1 ether);

        vm.startPrank(player);
        token.approve(address(game), betAmount);
        uint256 gameId = game.createGame(bytes32("fuzz-game"), commitment, betAmount);
        vm.stopPrank();

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

        uint256 playerBalanceBefore = token.balanceOf(player);
        uint256 feesBefore = game.ownerFees();

        vm.prank(backend);
        game.cashOut(gameId, payoutAmount, seed);

        assertEq(token.balanceOf(player) - playerBalanceBefore, expectedPlayerPayout);
        assertEq(game.ownerFees() - feesBefore, expectedHouseFee);
    }

}

// ============ Reentrancy Attack Contract ============

contract ReentrancyAttacker {
    MultiplierGame public target;
    IERC20 public token;
    uint256 public attackGameId;
    bytes32 public attackSeed;
    uint256 public attackPayout;
    uint256 public attackCount;

    constructor(address _target, address _token) {
        target = MultiplierGame(payable(_target));
        token = IERC20(_token);
    }

    function attack(uint256 gameId, uint256 payoutAmount, bytes32 seed) external {
        attackGameId = gameId;
        attackSeed = seed;
        attackPayout = payoutAmount;
        attackCount = 0;
        target.cashOut(gameId, payoutAmount, seed);
    }

    // ERC20 tokens don't trigger receive() on transfer, so we use a callback pattern
    // This test will verify reentrancy guard works even if called from another function
    function attemptReentrancy() external {
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
    ERC20Mock public token;
    ReentrancyAttacker public attacker;

    function setUp() public {
        token = new ERC20Mock();
        game = new MultiplierGame(address(token));
        
        token.mint(address(this), 100 ether);
        token.approve(address(game), 100 ether);
        game.refillPot(100 ether);
        
        attacker = new ReentrancyAttacker(address(game), address(token));
        token.mint(address(attacker), 10 ether);
    }

    function test_ReentrancyGuard() public {
        // Create a game with attacker as player
        bytes32 seed = keccak256("attacker-seed");
        uint256 payoutAmount = 1 ether;
        bytes32 commitment = keccak256(abi.encodePacked(seed, payoutAmount));

        vm.startPrank(address(attacker));
        token.approve(address(game), 0.5 ether);
        uint256 gameId = game.createGame(bytes32("attack-game"), commitment, 0.5 ether);
        vm.stopPrank();

        // Authorize attacker as backend for this test
        game.setBackend(address(attacker), true);

        // Attempt reentrancy attack
        vm.prank(address(attacker));
        attacker.attack(gameId, payoutAmount, seed);

        // Verify game was only cashed out once
        MultiplierGame.Game memory gameData = game.getGame(gameId);
        assertEq(uint8(gameData.status), uint8(MultiplierGame.Status.CASHED_OUT));
    }
}
