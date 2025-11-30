import { privateKeyToAccount } from "viem/accounts";
import { keccak256, encodePacked, toBytes } from "viem";
import { MultiplierGameClient, GameStatus } from "./lib/multiplier-game-client";

// Anvil default private keys
const PLAYER_PRIVATE_KEY =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"; // Account #1
const BACKEND_PRIVATE_KEY =
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"; // Account #2
const OWNER_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Account #0

function formatEther(wei: bigint): string {
  return (Number(wei) / 1e18).toFixed(4);
}

function formatStatus(status: GameStatus): string {
  switch (status) {
    case GameStatus.CREATED:
      return "CREATED";
    case GameStatus.CASHED_OUT:
      return "CASHED_OUT";
    case GameStatus.LOST:
      return "LOST";
    default:
      return `UNKNOWN(${status})`;
  }
}

async function main() {
  console.log("🎮 MultiplierGame Interaction Demo\n");
  console.log("=".repeat(50) + "\n");

  // Create clients for different roles
  const playerAccount = privateKeyToAccount(PLAYER_PRIVATE_KEY as `0x${string}`);
  const backendAccount = privateKeyToAccount(BACKEND_PRIVATE_KEY as `0x${string}`);
  const ownerAccount = privateKeyToAccount(OWNER_PRIVATE_KEY as `0x${string}`);

  const playerClient = new MultiplierGameClient("http://localhost:8545", playerAccount);
  const backendClient = new MultiplierGameClient("http://localhost:8545", backendAccount);
  const ownerClient = new MultiplierGameClient("http://localhost:8545", ownerAccount);

  console.log(`Contract Address: ${playerClient.getAddress()}\n`);
  console.log(`Player: ${playerAccount.address}`);
  console.log(`Backend: ${backendAccount.address}`);
  console.log(`Owner: ${ownerAccount.address}\n`);

  // 1. Check initial state
  console.log("📊 Initial Contract State");
  console.log("-".repeat(50));
  const potBalance = await playerClient.getPotBalance();
  const maxBet = await playerClient.getMaxBet();
  const maxPayout = await playerClient.getMaxPayout();
  const owner = await playerClient.getOwner();

  console.log(`Pot Balance: ${formatEther(potBalance)} ETH`);
  console.log(`Max Bet: ${formatEther(maxBet)} ETH`);
  console.log(`Max Payout: ${formatEther(maxPayout)} ETH`);
  console.log(`Owner: ${owner}\n`);

  // 2. Authorize backend (owner)
  console.log("🔐 Authorizing Backend (Owner)");
  console.log("-".repeat(50));
  const isAuthorizedBefore = await ownerClient.isBackendAuthorized(backendAccount.address);
  console.log(`Backend authorized before: ${isAuthorizedBefore}`);

  if (!isAuthorizedBefore) {
    const authTx = await ownerClient.setBackend(backendAccount.address, true);
    console.log(`✓ Authorization transaction: ${authTx}`);
    const isAuthorizedAfter = await ownerClient.isBackendAuthorized(backendAccount.address);
    console.log(`Backend authorized after: ${isAuthorizedAfter}\n`);
  } else {
    console.log("Backend already authorized\n");
  }

  // 3. Create a game (player)
  console.log("🎲 Creating Game (Player)");
  console.log("-".repeat(50));

  // Generate seed and calculate payout
  const seed = keccak256(toBytes(`game-seed-${Date.now()}`));
  const betAmount = BigInt("500000000000000000"); // 0.5 ETH
  const payoutAmount = BigInt("1000000000000000000"); // 1 ETH (2x multiplier)
  const commitmentHash = MultiplierGameClient.createCommitment(seed, payoutAmount);
  const preliminaryId = keccak256(toBytes("preliminary-game-1"));

  console.log(`Seed: ${seed}`);
  console.log(`Bet Amount: ${formatEther(betAmount)} ETH`);
  console.log(`Payout Amount: ${formatEther(payoutAmount)} ETH`);
  console.log(`Commitment Hash: ${commitmentHash}\n`);

  const { gameId, txHash } = await playerClient.createGame(
    preliminaryId,
    commitmentHash,
    betAmount
  );

  console.log(`✓ Game created!`);
  console.log(`  Game ID: ${gameId}`);
  console.log(`  Transaction: ${txHash}\n`);

  // 4. Query game state
  console.log("📋 Querying Game State");
  console.log("-".repeat(50));
  const game = await playerClient.getGame(gameId);
  console.log(`Player: ${game.player}`);
  console.log(`Bet Amount: ${formatEther(game.betAmount)} ETH`);
  console.log(`Status: ${formatStatus(game.status)}`);
  console.log(`Created At: ${new Date(Number(game.createdAt) * 1000).toISOString()}\n`);

  // 5. Simulate gameplay (wait a bit)
  console.log("⏳ Simulating gameplay (off-chain)...\n");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 6. Cash out (player)
  console.log("💰 Cashing Out (Player)");
  console.log("-".repeat(50));
  const playerBalanceBefore = await playerClient.getPotBalance();
  console.log(`Pot balance before: ${formatEther(playerBalanceBefore)} ETH`);

  const cashOutTx = await playerClient.cashOut(gameId, payoutAmount, seed);
  console.log(`✓ Cash out transaction: ${cashOutTx}`);

  const gameAfterCashOut = await playerClient.getGame(gameId);
  console.log(`Game status after cashout: ${formatStatus(gameAfterCashOut.status)}`);

  const potBalanceAfter = await playerClient.getPotBalance();
  console.log(`Pot balance after: ${formatEther(potBalanceAfter)} ETH`);

  const ownerFees = await playerClient.getOwnerFees();
  console.log(`Owner fees accumulated: ${formatEther(ownerFees)} ETH\n`);

  // 7. Create another game to test mark as lost
  console.log("🎲 Creating Second Game (Player)");
  console.log("-".repeat(50));
  const seed2 = keccak256(toBytes(`game-seed-${Date.now()}-2`));
  const payoutAmount2 = BigInt("2000000000000000000"); // 2 ETH
  const commitmentHash2 = MultiplierGameClient.createCommitment(seed2, payoutAmount2);
  const preliminaryId2 = keccak256(toBytes("preliminary-game-2"));

  const { gameId: gameId2 } = await playerClient.createGame(
    preliminaryId2,
    commitmentHash2,
    betAmount
  );
  console.log(`✓ Game 2 created! Game ID: ${gameId2}\n`);

  // 8. Mark game as lost (backend)
  console.log("❌ Marking Game as Lost (Backend)");
  console.log("-".repeat(50));
  const markLostTx = await backendClient.markGameAsLost(gameId2);
  console.log(`✓ Mark lost transaction: ${markLostTx}`);

  const game2AfterLost = await playerClient.getGame(gameId2);
  console.log(`Game 2 status: ${formatStatus(game2AfterLost.status)}\n`);

  // 9. Test owner functions
  console.log("👑 Testing Owner Functions");
  console.log("-".repeat(50));

  // Refill pot
  const refillAmount = BigInt("50000000000000000000"); // 50 ETH
  console.log(`Refilling pot with ${formatEther(refillAmount)} ETH...`);
  const refillTx = await ownerClient.refillPot(refillAmount);
  console.log(`✓ Refill transaction: ${refillTx}`);

  const potBalanceAfterRefill = await ownerClient.getPotBalance();
  console.log(`Pot balance after refill: ${formatEther(potBalanceAfterRefill)} ETH\n`);

  // Summary
  console.log("=".repeat(50));
  console.log("✅ Interaction Demo Complete!");
  console.log("=".repeat(50));
}

main().catch((error) => {
  console.error("❌ Interaction failed:", error);
  process.exit(1);
});

