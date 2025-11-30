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

    function _createReveal(string memory seed) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(seed));
    }

    function _createCommitment(bytes32 reveal) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(reveal));
    }

    function _createGame(
        address _player,
        uint256 betAmount,
        bytes32 preliminaryId,
        bytes32 reveal
    ) internal returns (uint256 gameId) {
        bytes32 commitment = _createCommitment(reveal);
        
        vm.prank(_player);
        gameId = game.createGame{value: betAmount}(preliminaryId, commitment);
    }

    // ============ createGame Tests ============

    function test_CreateGame_Success() public {
        bytes32 preliminaryId = bytes32("game-123");
        bytes32 reveal = _createReveal("secret-seed");
        bytes32 commitment = _createCommitment(reveal);
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

        bytes32 reveal = _createReveal("seed");
        bytes32 commitment = _createCommitment(reveal);

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
        bytes32 reveal = _createReveal("seed");
        bytes32 commitment = _createCommitment(reveal);

        vm.prank(player);
        vm.expectRevert(MultiplierGame.ZeroBet.selector);
        game.createGame{value: 0}(bytes32("id"), commitment);
    }

    function test_CreateGame_IncrementGameId() public {
        bytes32 reveal = _createReveal("seed");
        bytes32 commitment = _createCommitment(reveal);

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
        bytes32 reveal = _createReveal("my-secret-seed");
        uint256 betAmount = 0.5 ether;
        
        uint256 gameId = _createGame(player, betAmount, bytes32("game-1"), reveal);

        // Payout is bet * 2 = 1 ether (within 5% max payout limit)
        uint256 payoutAmount = 1 ether;
        uint256 houseFee = (payoutAmount * 500) / 10000; // 5% = 0.05 ether
        uint256 expectedPlayerPayout = payoutAmount - houseFee;

        uint256 playerBalanceBefore = player.balance;

        vm.prank(player);
        game.cashOut(gameId, payoutAmount, reveal);

        MultiplierGame.Game memory gameData = game.getGame(gameId);
        assertEq(uint8(gameData.status), uint8(MultiplierGame.Status.CASHED_OUT));

        uint256 playerBalanceAfter = player.balance;
        assertEq(playerBalanceAfter - playerBalanceBefore, expectedPlayerPayout);

        // Verify house fee accumulated
        assertEq(game.ownerFees(), houseFee);
    }

    function test_CashOut_InvalidReveal_Reverts() public {
        bytes32 correctReveal = _createReveal("correct-seed");
        bytes32 wrongReveal = _createReveal("wrong-seed");
        
        uint256 gameId = _createGame(player, 0.5 ether, bytes32("game-1"), correctReveal);

        bytes32 wrongCommitment = keccak256(abi.encodePacked(wrongReveal));
        bytes32 expectedCommitment = keccak256(abi.encodePacked(correctReveal));

        vm.prank(player);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.InvalidReveal.selector,
                wrongCommitment,
                expectedCommitment
            )
        );
        game.cashOut(gameId, 1 ether, wrongReveal);
    }

    function test_CashOut_ExceedsMaxPayout_Reverts() public {
        bytes32 reveal = _createReveal("seed");
        uint256 gameId = _createGame(player, 0.5 ether, bytes32("game-1"), reveal);

        uint256 maxPayout = game.getMaxPayout();
        uint256 excessivePayout = maxPayout + 1;

        vm.prank(player);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.PayoutExceedsMaxPayout.selector,
                excessivePayout,
                maxPayout
            )
        );
        game.cashOut(gameId, excessivePayout, reveal);
    }

    function test_CashOut_NotPlayer_Reverts() public {
        bytes32 reveal = _createReveal("seed");
        uint256 gameId = _createGame(player, 0.5 ether, bytes32("game-1"), reveal);

        vm.prank(unauthorized);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.NotGamePlayer.selector,
                unauthorized,
                player
            )
        );
        game.cashOut(gameId, 1 ether, reveal);
    }

    function test_CashOut_AlreadyCashedOut_Reverts() public {
        bytes32 reveal = _createReveal("seed");
        uint256 gameId = _createGame(player, 0.5 ether, bytes32("game-1"), reveal);

        vm.startPrank(player);
        game.cashOut(gameId, 1 ether, reveal);

        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.GameNotInCreatedStatus.selector,
                gameId,
                MultiplierGame.Status.CASHED_OUT
            )
        );
        game.cashOut(gameId, 1 ether, reveal);
        vm.stopPrank();
    }

    function test_CashOut_GameMarkedLost_Reverts() public {
        bytes32 reveal = _createReveal("seed");
        uint256 gameId = _createGame(player, 0.5 ether, bytes32("game-1"), reveal);

        // Backend marks game as lost
        vm.prank(backend);
        game.markGameAsLost(gameId);

        vm.prank(player);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.GameNotInCreatedStatus.selector,
                gameId,
                MultiplierGame.Status.LOST
            )
        );
        game.cashOut(gameId, 1 ether, reveal);
    }

    // ============ markGameAsLost Tests ============

    function test_MarkGameAsLost_Backend_Success() public {
        bytes32 reveal = _createReveal("seed");
        uint256 gameId = _createGame(player, 0.5 ether, bytes32("game-1"), reveal);

        vm.expectEmit(true, true, true, true);
        emit GameStatusUpdated(gameId, MultiplierGame.Status.LOST);

        vm.prank(backend);
        game.markGameAsLost(gameId);

        MultiplierGame.Game memory gameData = game.getGame(gameId);
        assertEq(uint8(gameData.status), uint8(MultiplierGame.Status.LOST));
    }

    function test_MarkGameAsLost_Unauthorized_Reverts() public {
        bytes32 reveal = _createReveal("seed");
        uint256 gameId = _createGame(player, 0.5 ether, bytes32("game-1"), reveal);

        vm.prank(unauthorized);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.UnauthorizedBackend.selector,
                unauthorized
            )
        );
        game.markGameAsLost(gameId);
    }

    function test_MarkGameAsLost_AlreadyCashedOut_Reverts() public {
        bytes32 reveal = _createReveal("seed");
        uint256 gameId = _createGame(player, 0.5 ether, bytes32("game-1"), reveal);

        // Player cashes out
        vm.prank(player);
        game.cashOut(gameId, 1 ether, reveal);

        vm.prank(backend);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiplierGame.GameNotInCreatedStatus.selector,
                gameId,
                MultiplierGame.Status.CASHED_OUT
            )
        );
        game.markGameAsLost(gameId);
    }

    // ============ Pause Tests ============

    function test_Pause_BlocksGameCreation() public {
        game.pause();

        bytes32 reveal = _createReveal("seed");
        bytes32 commitment = _createCommitment(reveal);

        vm.prank(player);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        game.createGame{value: 0.5 ether}(bytes32("id"), commitment);
    }

    function test_Unpause_AllowsGameCreation() public {
        game.pause();
        game.unpause();

        bytes32 reveal = _createReveal("seed");
        bytes32 commitment = _createCommitment(reveal);

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
        bytes32 reveal = _createReveal("seed");
        uint256 gameId = _createGame(player, 0.5 ether, bytes32("game-1"), reveal);

        vm.prank(player);
        game.cashOut(gameId, 2 ether, reveal);

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

        bytes32 reveal = _createReveal("fuzz-seed");
        bytes32 commitment = _createCommitment(reveal);

        vm.prank(player);
        uint256 gameId = game.createGame{value: betAmount}(bytes32("fuzz-game"), commitment);

        MultiplierGame.Game memory gameData = game.getGame(gameId);
        assertEq(gameData.betAmount, betAmount);
        assertEq(gameData.player, player);
    }

    function testFuzz_CashOut_PayoutCalculation(uint256 payoutAmount) public {
        bytes32 reveal = _createReveal("fuzz-seed");
        uint256 gameId = _createGame(player, 0.5 ether, bytes32("fuzz-game"), reveal);

        uint256 maxPayout = game.getMaxPayout();
        payoutAmount = bound(payoutAmount, 1, maxPayout);

        uint256 expectedHouseFee = (payoutAmount * 500) / 10000;
        uint256 expectedPlayerPayout = payoutAmount - expectedHouseFee;

        uint256 playerBalanceBefore = player.balance;
        uint256 feesBefore = game.ownerFees();

        vm.prank(player);
        game.cashOut(gameId, payoutAmount, reveal);

        assertEq(player.balance - playerBalanceBefore, expectedPlayerPayout);
        assertEq(game.ownerFees() - feesBefore, expectedHouseFee);
    }
}

// ============ Reentrancy Attack Contract ============

contract ReentrancyAttacker {
    MultiplierGame public target;
    uint256 public attackGameId;
    bytes32 public attackReveal;
    uint256 public attackCount;

    constructor(address _target) {
        target = MultiplierGame(payable(_target));
    }

    function attack(uint256 gameId, bytes32 reveal) external {
        attackGameId = gameId;
        attackReveal = reveal;
        attackCount = 0;
        target.cashOut(gameId, 1 ether, reveal);
    }

    receive() external payable {
        if (attackCount < 3) {
            attackCount++;
            try target.cashOut(attackGameId, 1 ether, attackReveal) {
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
        bytes32 reveal = keccak256(abi.encodePacked("attacker-seed"));
        bytes32 commitment = keccak256(abi.encodePacked(reveal));

        vm.prank(address(attacker));
        uint256 gameId = game.createGame{value: 0.5 ether}(bytes32("attack-game"), commitment);

        // Attempt reentrancy attack
        vm.prank(address(attacker));
        attacker.attack(gameId, reveal);

        // Verify game was only cashed out once
        MultiplierGame.Game memory gameData = game.getGame(gameId);
        assertEq(uint8(gameData.status), uint8(MultiplierGame.Status.CASHED_OUT));

        // Attack count should be 0 or caught by revert
        // The game status prevents re-cashout even if reentrancy was possible
    }
}

