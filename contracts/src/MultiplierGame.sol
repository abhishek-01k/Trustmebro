// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MultiplierGame
 * @notice A provably fair multiplier game contract using commit-reveal mechanism
 * @dev Uses keccak256 for commitment verification, with pot-based risk controls
 */
contract MultiplierGame is ReentrancyGuard, Ownable, Pausable {
    // ============ Enums ============

    enum Status {
        CREATED,
        CASHED_OUT,
        LOST
    }

    // ============ Structs ============

    struct Game {
        address player;
        uint256 betAmount;
        bytes32 commitmentHash;
        Status status;
        bytes32 preliminaryGameId;
        uint256 createdAt;
    }

    // ============ Constants ============

    /// @notice House edge in basis points (5% = 500 bps)
    uint256 public constant HOUSE_EDGE_BPS = 500;

    /// @notice Maximum bet as percentage of pot in basis points (1% = 100 bps)
    uint256 public constant MAX_BET_BPS = 100;

    /// @notice Maximum payout as percentage of pot in basis points (5% = 500 bps)
    uint256 public constant MAX_PAYOUT_BPS = 500;

    /// @notice Basis points denominator
    uint256 private constant BPS_DENOMINATOR = 10000;

    // ============ State Variables ============

    /// @notice Mapping of game ID to Game struct
    mapping(uint256 => Game) public games;

    /// @notice Mapping of authorized backend addresses
    mapping(address => bool) public authorizedBackends;

    /// @notice Counter for on-chain game IDs
    uint256 public nextOnChainGameId;

    /// @notice Accumulated owner fees (house edge)
    uint256 public ownerFees;

    // ============ Events ============

    /// @notice Emitted when a new game is created
    event GameCreated(
        bytes32 preliminaryGameId,
        uint256 indexed onChainGameId,
        address indexed player,
        uint256 betAmount,
        bytes32 commitmentHash
    );

    /// @notice Emitted when a payout is sent to a player
    event PayoutSent(
        uint256 indexed onChainGameId,
        uint256 amount,
        address indexed recipient
    );

    /// @notice Emitted when a game status is updated
    event GameStatusUpdated(
        uint256 indexed onChainGameId,
        Status status
    );

    /// @notice Emitted when a backend authorization status changes
    event BackendAuthorizationChanged(
        address indexed backend,
        bool authorized
    );

    /// @notice Emitted when the pot is refilled
    event PotRefilled(
        address indexed funder,
        uint256 amount
    );

    /// @notice Emitted when owner withdraws fees
    event FeesWithdrawn(
        address indexed owner,
        uint256 amount
    );

    // ============ Errors ============

    error BetExceedsMaxBet(uint256 bet, uint256 maxBet);
    error PayoutExceedsMaxPayout(uint256 payout, uint256 maxPayout);
    error InsufficientPot(uint256 requested, uint256 available);
    error InvalidReveal(bytes32 provided, bytes32 expected);
    error GameNotInCreatedStatus(uint256 gameId, Status currentStatus);
    error NotGamePlayer(address caller, address player);
    error UnauthorizedBackend(address caller);
    error InsufficientFees(uint256 requested, uint256 available);
    error TransferFailed();
    error ZeroBet();

    // ============ Modifiers ============

    /// @notice Ensures caller is an authorized backend
    modifier onlyBackend() {
        if (!authorizedBackends[msg.sender]) {
            revert UnauthorizedBackend(msg.sender);
        }
        _;
    }

    // ============ Constructor ============

    /// @notice Initializes the contract with the deployer as owner
    constructor() Ownable(msg.sender) {}

    // ============ Player Functions ============

    /**
     * @notice Creates a new game with a bet and commitment hash
     * @param preliminaryId Off-chain game identifier
     * @param commitmentHash Hash of the reveal data (keccak256)
     * @return onChainGameId The on-chain game ID
     */
    function createGame(
        bytes32 preliminaryId,
        bytes32 commitmentHash
    ) external payable whenNotPaused nonReentrant returns (uint256 onChainGameId) {
        if (msg.value == 0) {
            revert ZeroBet();
        }

        // Calculate max bet based on pot BEFORE this bet was added
        // (msg.value is already in contract balance when function executes)
        uint256 potBeforeBet = address(this).balance - ownerFees - msg.value;
        uint256 maxBet = (potBeforeBet * MAX_BET_BPS) / BPS_DENOMINATOR;
        if (msg.value > maxBet) {
            revert BetExceedsMaxBet(msg.value, maxBet);
        }

        onChainGameId = nextOnChainGameId++;

        games[onChainGameId] = Game({
            player: msg.sender,
            betAmount: msg.value,
            commitmentHash: commitmentHash,
            status: Status.CREATED,
            preliminaryGameId: preliminaryId,
            createdAt: block.timestamp
        });

        emit GameCreated(
            preliminaryId,
            onChainGameId,
            msg.sender,
            msg.value,
            commitmentHash
        );
    }

    /**
     * @notice Cash out a game by providing the reveal and payout amount
     * @param gameId The on-chain game ID
     * @param payoutAmount The amount to pay out (calculated off-chain)
     * @param reveal The reveal data that hashes to the commitment
     */
    function cashOut(
        uint256 gameId,
        uint256 payoutAmount,
        bytes32 reveal
    ) external nonReentrant {
        Game storage game = games[gameId];

        // Verify caller is the player
        if (msg.sender != game.player) {
            revert NotGamePlayer(msg.sender, game.player);
        }

        // Verify game is in CREATED status
        if (game.status != Status.CREATED) {
            revert GameNotInCreatedStatus(gameId, game.status);
        }

        // Verify the reveal matches the commitment
        bytes32 computedHash = keccak256(abi.encodePacked(reveal));
        if (computedHash != game.commitmentHash) {
            revert InvalidReveal(computedHash, game.commitmentHash);
        }

        // Check payout limits
        uint256 maxPayout = getMaxPayout();
        if (payoutAmount > maxPayout) {
            revert PayoutExceedsMaxPayout(payoutAmount, maxPayout);
        }

        // Check pot solvency
        uint256 pot = getPotBalance();
        if (payoutAmount > pot) {
            revert InsufficientPot(payoutAmount, pot);
        }

        // Calculate house fee
        uint256 houseFee = (payoutAmount * HOUSE_EDGE_BPS) / BPS_DENOMINATOR;
        uint256 playerPayout = payoutAmount - houseFee;

        // Update state before transfer
        game.status = Status.CASHED_OUT;
        ownerFees += houseFee;

        // Transfer payout to player
        (bool success, ) = payable(game.player).call{value: playerPayout}("");
        if (!success) {
            revert TransferFailed();
        }

        emit PayoutSent(gameId, playerPayout, game.player);
        emit GameStatusUpdated(gameId, Status.CASHED_OUT);
    }

    /**
     * @notice Get game details by ID
     * @param gameId The on-chain game ID
     * @return The Game struct
     */
    function getGame(uint256 gameId) external view returns (Game memory) {
        return games[gameId];
    }

    // ============ Backend Functions ============

    /**
     * @notice Mark a game as lost (player hit death cup or abandoned)
     * @param gameId The on-chain game ID
     */
    function markGameAsLost(uint256 gameId) external onlyBackend {
        Game storage game = games[gameId];

        // Verify game is in CREATED status
        if (game.status != Status.CREATED) {
            revert GameNotInCreatedStatus(gameId, game.status);
        }

        game.status = Status.LOST;

        emit GameStatusUpdated(gameId, Status.LOST);
    }

    // ============ Owner Functions ============

    /**
     * @notice Set or revoke backend authorization
     * @param backend The backend address
     * @param authorized Whether the backend is authorized
     */
    function setBackend(address backend, bool authorized) external onlyOwner {
        authorizedBackends[backend] = authorized;
        emit BackendAuthorizationChanged(backend, authorized);
    }

    /**
     * @notice Pause the contract (blocks new game creation)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Add funds to the pot
     */
    function refillPot() external payable onlyOwner {
        emit PotRefilled(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw accumulated owner fees
     * @param amount The amount to withdraw
     */
    function withdrawFees(uint256 amount) external onlyOwner nonReentrant {
        if (amount > ownerFees) {
            revert InsufficientFees(amount, ownerFees);
        }

        ownerFees -= amount;

        (bool success, ) = payable(owner()).call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }

        emit FeesWithdrawn(msg.sender, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Get the current pot balance (excludes owner fees)
     * @return The pot balance available for payouts
     */
    function getPotBalance() public view returns (uint256) {
        return address(this).balance - ownerFees;
    }

    /**
     * @notice Get the maximum allowed bet (1% of pot)
     * @return The maximum bet amount
     */
    function getMaxBet() public view returns (uint256) {
        return (getPotBalance() * MAX_BET_BPS) / BPS_DENOMINATOR;
    }

    /**
     * @notice Get the maximum allowed payout (5% of pot)
     * @return The maximum payout amount
     */
    function getMaxPayout() public view returns (uint256) {
        return (getPotBalance() * MAX_PAYOUT_BPS) / BPS_DENOMINATOR;
    }

    // ============ Receive Function ============

    /// @notice Allow contract to receive ETH directly (for pot funding)
    receive() external payable {
        emit PotRefilled(msg.sender, msg.value);
    }
}

