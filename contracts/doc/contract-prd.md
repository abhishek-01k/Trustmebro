# 📄 Smart Contract PRD (Product Requirements Document)

## Provably Fair Multiplier Game — On-Chain Contracts

### 🧩 1. Project Summary

This project consists of an on-chain Multiplier Game Smart Contract that enables:

- Provably fair gameplay using a commit–reveal mechanism
- Secure on-chain bet custody and payouts
- Enforced risk controls (max bet = 1% pot, max payout = 5% pot)
- Event-driven backend integration
- Immutable proof that game outcomes were fixed before the player started

The contract is minimalistic by design—offloading game logic, RNG, and multipliers to a backend while ensuring fairness and solvency on-chain.

### 🏗 2. Smart Contract Responsibilities

**The contract must:**

- Accept player bets
- Store a verifiable cryptographic commitment (SHA-256 hash)
- Validate reveals submitted on cash out
- Enforce pot-based bet/payout limits
- Transfer payouts securely
- Mark games as lost
- Emit events for off-chain indexing
- Support authorized backend management
- Manage pot liquidity and owner controls

**The contract must not:**

- Generate randomness
- Compute multipliers
- Determine death cup locations
- Make game decisions
- Perform heavy computation

All gameplay mechanics occur off-chain.

### 🎮 3. Game Lifecycle (On-Chain Perspective)

#### 1. Create Game

**Player calls:**

```
createGame(preliminaryGameId, commitmentHash)
```

along with a bet (`msg.value`).

**Contract:**

- Ensures bet ≤ maxBet (1% of pot)
- Stores game with status `CREATED`
- Emits `GameCreated`

#### 2. Gameplay Happens Off-Chain

**Backend:**

- Generates random seed
- Computes death cup positions
- Computes multipliers
- Tracks each round

**Contract:**

- Does nothing during this phase.

#### 3. Cash Out

**Player or backend calls:**

```
cashOut(onChainGameId, payoutAmount, reveal)
```

**Contract:**

- Verifies commitment via `keccak256(reveal) == commitmentHash`
- Ensures payout ≤ maxPayout (5% pot)
- Transfers payout
- Marks game as `CASHED_OUT`
- Emits `PayoutSent` + `GameStatusUpdated`

#### 4. Losing Condition

**Backend calls:**

```
markGameAsLost(onChainGameId)
```

**Contract:**

- Marks game as `LOST`
- Emits `GameStatusUpdated`

### 🔒 4. Provably Fair Commit–Reveal Model

**Stored On-Chain**

```
commitmentHash = SHA256({version, rows, seed})
```

**Reveal Provided at Cash Out**

Player/backend submit:

```
reveal = {version, rows, seed}
```

Contract verifies:

```
hash(reveal) == commitmentHash
```

**This proves:**

- Death cup positions were generated before gameplay
- Backend cannot change outcome
- Game was fair and immutable

### 🧮 5. Multiplier Model (Off-Chain Logic Reference)

Although not computed on-chain, the contract must accept payout values generated as follows:

**Base Multiplier per Round**

```
BaseMult = C / (C - 1)
```

**Cumulative Multiplier**

```
CumMult = product(BaseMult_i)
```

**Apply RTP 95%**

```
FinalMult = CumMult * 0.95
```

**Payout**

```
payoutAmount = betAmount * FinalMult
```

The contract only checks:

- `payout ≤ maxPayout`
- `reveal` is valid

### 🧱 6. Storage Requirements

**Game Struct**

```solidity
struct Game {
  address player;
  uint256 betAmount;
  bytes32 commitmentHash;
  Status status;              // CREATED, CASHED_OUT, LOST
  bytes32 preliminaryGameId;
  uint256 createdAt;
}
```

**Mappings**

```
mapping(uint256 => Game) games;
mapping(address => bool) authorizedBackends;
```

**Counters**

```
nextOnChainGameId
ownerFees (optional)
```

### 🪪 7. Events

**GameCreated**

```solidity
event GameCreated(
  bytes32 preliminaryGameId,
  uint256 indexed onChainGameId,
  address indexed player,
  uint256 betAmount,
  bytes32 commitmentHash
);
```

**PayoutSent**

```solidity
event PayoutSent(
  uint256 indexed onChainGameId,
  uint256 amount,
  address indexed recipient
);
```

**GameStatusUpdated**

```solidity
event GameStatusUpdated(
  uint256 indexed onChainGameId,
  uint8 status
);
```

These events serve as the source of truth for backend state indexing.

### 🔐 8. Access Control Requirements

**Owner**

- Add/remove authorized backend
- Pause/unpause game
- Refill pot
- Withdraw owner fees
- Emergency withdrawals

**Authorized Backend**

- Mark games as lost
- (Optional) Initiate cash outs on player's behalf

**Player**

- Create game
- Cash out game (preferred flow)

### 🛡 9. Risk Constraints

**Max Bet**

```
maxBet = potBalance * 1%
```

**Max Payout**

```
maxPayout = potBalance * 5%
```

**Solvency**

Contract must always check:

```
payoutAmount <= potBalance
payoutAmount <= maxPayout
```

**Reentrancy**

All ETH transfers must use:

```
nonReentrant
call{value: amount}("")
```

### ⚠ 10. Failure Modes & Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Wrong reveal | Revert transaction |
| Payout > max | Revert |
| Not enough pot | Revert |
| Game already finalized | Revert |
| Unauthorized backend | Revert |
| Player abandons game | Backend calls `markGameAsLost` |

### 📦 11. Smart Contract Interfaces

**Player Facing**

```solidity
function createGame(bytes32 preliminaryId, bytes32 commitmentHash) external payable;
function cashOut(uint256 gameId, uint256 payoutAmount, bytes32 reveal) external;
function getGame(uint256 gameId) external view returns (Game memory);
```

**Backend**

```solidity
function markGameAsLost(uint256 gameId) external;
```

**Owner**

```solidity
function setBackend(address backend, bool allowed) external;
function pause() external;
function unpause() external;
function refillPot() external payable;
function withdrawFees(uint256 amount) external;
```

### 🧪 12. Test Requirements

**Unit Tests**

- Create game success/failure
- Correct enforcement of max bet
- Cash out success
- Wrong reveal fails
- Exceeding max payout fails
- Reentrancy guard tests
- Unauthorized backend tests

**Integration**

- Simulate off-chain game generation
- Verify reveal correctness
- Replay full create → play → reveal flow

### 🧱 13. Non-Functional Requirements

**Gas Efficiency**

- Minimal storage writes
- No multipliers computed on-chain
- No looping over dynamic arrays on-chain

**Security**

- commit–reveal integrity
- pot solvency protection
- owner access control
- reentrancy protection
- pause support

**Scalability**

- Thousands of games per day
- Backend event-driven indexing

### 🚀 14. Future Extensions

- Fully on-chain VRF (Chainlink / SWITCHBOARD)
- Multi-round commit–reveal
- Fee-sharing or affiliate system
- NFT-based session receipts
- Jackpot pooling

