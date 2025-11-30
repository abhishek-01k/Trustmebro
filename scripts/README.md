# MultiplierGame TypeScript Client

TypeScript scripts for deploying and interacting with the MultiplierGame smart contract on a local Anvil testnet.

## Prerequisites

1. **Build the contracts:**
   ```bash
   pnpm contracts:build
   ```

2. **Start Anvil (in a separate terminal):**
   ```bash
   pnpm contracts:anvil
   ```

## Quick Start

### 1. Deploy the Contract

Deploy the MultiplierGame contract to your local Anvil instance:

```bash
pnpm scripts:deploy
```

This will:
- Deploy the contract to Anvil
- Fund the pot with 100 ETH
- Save the deployment address to `scripts/.deployed-address.json`

### 2. Interact with the Contract

Run the example interaction script that demonstrates the full game lifecycle:

```bash
pnpm scripts:interact
```

This demonstrates:
- Creating a game with a bet
- Cashing out with reveal
- Marking games as lost (backend)
- Owner functions (authorize backend, refill pot)

## Project Structure

```
scripts/
├── deploy.ts                 # Deployment script
├── interact.ts               # Example interaction script
├── lib/
│   └── multiplier-game-client.ts  # Contract client wrapper
├── utils/
│   └── contract-utils.ts    # ABI loading, address management
├── .deployed-address.json   # Saved deployment address (gitignored)
└── README.md                # This file
```

## Using the Client Library

The `MultiplierGameClient` class provides a convenient wrapper around the contract:

```typescript
import { privateKeyToAccount } from "viem/accounts";
import { MultiplierGameClient } from "./lib/multiplier-game-client";

// Create a client with an account for transactions
const account = privateKeyToAccount("0x...");
const client = new MultiplierGameClient("http://localhost:8545", account);

// Or create a read-only client (no account needed)
const readOnlyClient = new MultiplierGameClient();

// Create a game
const seed = keccak256(stringToBytes("my-secret-seed"));
const payoutAmount = parseEther("1.0");
const commitmentHash = MultiplierGameClient.createCommitment(seed, payoutAmount);
const { gameId } = await client.createGame(preliminaryId, commitmentHash, parseEther("0.5"));

// Cash out
await client.cashOut(gameId, payoutAmount, seed);

// Query game state
const game = await client.getGame(gameId);
console.log(`Game status: ${game.status}`);
```

## Anvil Default Accounts

Anvil provides 10 accounts with 10,000 ETH each. The scripts use:

- **Account #0** (`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`): Owner/Deployer
- **Account #1** (`0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`): Player
- **Account #2** (`0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`): Backend

## Available Methods

### Player Functions
- `createGame(preliminaryId, commitmentHash, betAmount)` - Create a new game
- `cashOut(gameId, payoutAmount, seed)` - Cash out a game
- `getGame(gameId)` - Get game details

### Backend Functions
- `markGameAsLost(gameId)` - Mark a game as lost

### Owner Functions
- `setBackend(backend, authorized)` - Authorize/revoke backend
- `pause()` - Pause the contract
- `unpause()` - Unpause the contract
- `refillPot(amount)` - Add funds to the pot
- `withdrawFees(amount)` - Withdraw accumulated fees

### View Functions
- `getPotBalance()` - Get current pot balance
- `getMaxBet()` - Get maximum allowed bet
- `getMaxPayout()` - Get maximum allowed payout
- `getOwner()` - Get contract owner
- `getOwnerFees()` - Get accumulated owner fees
- `isBackendAuthorized(backend)` - Check if backend is authorized

## Commitment Generation

The contract uses a commit-reveal scheme where the payout amount is committed before the game starts:

```typescript
import { keccak256, encodePacked } from "viem";

const seed = keccak256(stringToBytes("random-seed"));
const payoutAmount = parseEther("1.0");
const commitmentHash = MultiplierGameClient.createCommitment(seed, payoutAmount);
// commitmentHash = keccak256(encodePacked(["bytes32", "uint256"], [seed, payoutAmount]))
```

This ensures the payout was fixed before gameplay and cannot be changed.

## Troubleshooting

**"Failed to connect to Anvil"**
- Make sure Anvil is running: `pnpm contracts:anvil`

**"No deployed address found"**
- Deploy the contract first: `pnpm scripts:deploy`

**"Failed to load contract ABI"**
- Build the contracts: `pnpm contracts:build`

**"Insufficient funds"**
- Anvil accounts start with 10,000 ETH. If you need more, restart Anvil.

## Next Steps

- Integrate the client into your frontend application
- Add event listeners for real-time updates
- Implement your game logic that generates seeds and calculates payouts
- Deploy to a testnet (Sepolia, Mumbai, etc.) for testing


