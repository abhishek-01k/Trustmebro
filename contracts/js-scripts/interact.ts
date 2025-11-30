import { privateKeyToAccount } from "viem/accounts";
import { keccak256, encodePacked, toBytes, parseEther } from "viem";
import { MultiplierGameClient, GameStatus } from "./lib/multiplier-game-client";
import { createCommitmentHash, generateAllDeathCups, generateGameSeed, getGameData } from "./utils/verifiable-utils";
import { loadDeployedToken } from "./deploy-token";

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

  // Load deployed token address
  const deployedToken = loadDeployedToken();
  if (!deployedToken) {
    console.error("❌ No deployed token found. Please deploy a token first:");
    console.error("   pnpm scripts:deploy-token");
    process.exit(1);
  }
  const tokenAddress = deployedToken.address as `0x${string}`;
  console.log(`✓ Using token address: ${tokenAddress}\n`);

  // Create clients for different roles
  const playerAccount = privateKeyToAccount(PLAYER_PRIVATE_KEY as `0x${string}`);
  const backendAccount = privateKeyToAccount(BACKEND_PRIVATE_KEY as `0x${string}`);
  const ownerAccount = privateKeyToAccount(OWNER_PRIVATE_KEY as `0x${string}`);

  const playerClient = new MultiplierGameClient("http://localhost:8545", playerAccount, tokenAddress);
  const backendClient = new MultiplierGameClient("http://localhost:8545", backendAccount, tokenAddress);
  const ownerClient = new MultiplierGameClient("http://localhost:8545", ownerAccount, tokenAddress);

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

  console.log(`Pot Balance: ${formatEther(potBalance)} tokens`);
  console.log(`Max Bet: ${formatEther(maxBet)} tokens`);
  console.log(`Max Payout: ${formatEther(maxPayout)} tokens`);
  console.log(`Owner: ${owner}\n`);

  // Check player token balance
  console.log("💰 Player Token Balance");
  console.log("-".repeat(50));
  const playerTokenBalance = await playerClient.getTokenBalance(playerAccount.address);
  console.log(`Player Token Balance: ${formatEther(playerTokenBalance)} tokens\n`);

  // Minimum bet amount constant
  const minBet = parseEther("0.001");

  // Calculate appropriate bet amounts based on player balance and contract limits
  // Use 10% of player balance or max bet, whichever is smaller
  const betAmountFromBalance = playerTokenBalance / BigInt(10);
  const betAmount = betAmountFromBalance < maxBet ? betAmountFromBalance : maxBet;
  
  // Ensure bet amount is at least 0.001 tokens (for testing)
  const finalBetAmount = betAmount < minBet ? minBet : betAmount;
  
  // Calculate payout (2x multiplier for example)
  const payoutAmount = finalBetAmount * BigInt(2);
  
  // Ensure payout doesn't exceed max payout
  const finalPayoutAmount = payoutAmount < maxPayout ? payoutAmount : maxPayout;
  
  console.log(`📊 Calculated Bet Amounts:`);
  console.log(`   Bet Amount: ${formatEther(finalBetAmount)} tokens`);
  console.log(`   Payout Amount: ${formatEther(finalPayoutAmount)} tokens (${formatEther(finalPayoutAmount / finalBetAmount)}x multiplier)\n`);

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

  // Ensure player has approved tokens
  console.log("🔐 Approving tokens for game contract...");
  const approvalAmount = finalBetAmount * BigInt(10); // Approve 10x for multiple games
  await playerClient.approveToken(approvalAmount);
  console.log(`✓ Approved ${formatEther(approvalAmount)} tokens\n`);

  const preliminaryId = keccak256(toBytes(`game-id-${Date.now()}`)); //Backend game id
  const seed = generateGameSeed()
  console.log(`Seed: ${seed}`);

  // Step 2: Define row configurations (example game)
  console.log('\n📋 Step 2: Defining Row Configurations...');
  const rowConfigs = [
    { tiles: 5 },  // Row 0: 5 cups
    { tiles: 4 },  // Row 1: 4 cups
    { tiles: 3 },  // Row 2: 3 cups
    { tiles: 2 },  // Row 3: 2 cups
  ];
  console.log('   Row Configurations:');
  rowConfigs.forEach((config, index) => {
    console.log(`     Row ${index}: ${config.tiles} cups`);
  });
  
  // Step 3: Generate death cup positions (but don't reveal yet)
  console.log('\n🎲 Step 3: Generating Death Cup Positions (Hidden)...');
  const deathCups = generateAllDeathCups(seed, rowConfigs);
  console.log('   Death cups generated (not revealed to player yet)', deathCups);
  
  // Step 4: Create commitment hash
  console.log('\n🔒 Step 4: Creating Commitment Hash...');
  const version = 'v1';
  const commitmentHash = createCommitmentHash(version, deathCups, seed);
  console.log(`   Version: ${version}`);
  console.log(`   Commitment Hash: ${commitmentHash}`);
  console.log('   ✅ This hash is stored on-chain and cannot be changed!');

  const gameData = getGameData(version, deathCups, seed);
  console.log('   Game Data: ', gameData);
  
  
  console.log(`Bet Amount: ${formatEther(finalBetAmount)} tokens`);
  // console.log(`Commitment Hash: ${commitmentHash}\n`);

  const { gameId, txHash } = await playerClient.createGame(
    preliminaryId,
    commitmentHash as `0x${string}`,
    finalBetAmount
  );

  console.log(`✓ Game created!`);
  console.log(`  Game ID: ${gameId}`);
  console.log(`  Transaction: ${txHash}\n`);

  // 4. Query game state
  console.log("📋 Querying Game State");
  console.log("-".repeat(50));
  const game = await playerClient.getGame(gameId);
  console.log(`Player: ${game.player}`);
  console.log(`Bet Amount: ${formatEther(game.betAmount)} tokens`);
  console.log(`Status: ${formatStatus(game.status)}`);
  const createdAtTimestamp = Number(game.createdAt);
  if (createdAtTimestamp > 0) {
    console.log(`Created At: ${new Date(createdAtTimestamp * 1000).toISOString()}\n`);
  } else {
    console.log(`Created At: ${createdAtTimestamp}\n`);
  }

  // 5. Simulate gameplay (wait a bit)
  console.log("⏳ Simulating gameplay (off-chain)...\n");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 6. Cash out (backend)
  console.log("💰 Cashing Out (Backend)");
  console.log("-".repeat(50));
  const playerBalanceBefore = await playerClient.getPotBalance();
  console.log(`Pot balance before: ${formatEther(playerBalanceBefore)} tokens`);

  const cashOutTx = await backendClient.cashOut(gameId, finalPayoutAmount, seed);
  console.log(`✓ Cash out transaction: ${cashOutTx}`);

  const gameAfterCashOut = await playerClient.getGame(gameId);
  console.log(`Game status after cashout: ${formatStatus(gameAfterCashOut.status)}`);

  const potBalanceAfter = await playerClient.getPotBalance();
  console.log(`Pot balance after: ${formatEther(potBalanceAfter)} tokens`);

  const ownerFees = await playerClient.getOwnerFees();
  console.log(`Owner fees accumulated: ${formatEther(ownerFees)} tokens\n`);

  // 7. Create another game to test mark as lost
  console.log("🎲 Creating Second Game (Player)");
  console.log("-".repeat(50));
  
  // Recalculate bet amounts based on current pot balance after first game
  const potBalanceAfterFirstGame = await playerClient.getPotBalance();
  const maxBetAfterFirstGame = await playerClient.getMaxBet();
  const maxPayoutAfterFirstGame = await playerClient.getMaxPayout();
  
  console.log(`Current pot balance: ${formatEther(potBalanceAfterFirstGame)} tokens`);
  console.log(`Current max bet: ${formatEther(maxBetAfterFirstGame)} tokens`);
  console.log(`Current max payout: ${formatEther(maxPayoutAfterFirstGame)} tokens`);
  
  // Calculate new bet amount based on current pot (use 10% of player balance or max bet, whichever is smaller)
  const playerTokenBalanceAfter = await playerClient.getTokenBalance(playerAccount.address);
  const betAmountFromBalance2 = playerTokenBalanceAfter / BigInt(10);
  const betAmount2 = betAmountFromBalance2 < maxBetAfterFirstGame ? betAmountFromBalance2 : maxBetAfterFirstGame;
  
  // Ensure bet amount is at least 0.001 tokens but doesn't exceed max bet
  const finalBetAmount2 = betAmount2 < minBet ? minBet : (betAmount2 > maxBetAfterFirstGame ? maxBetAfterFirstGame : betAmount2);
  
  // Calculate payout (2x multiplier for example)
  const payoutAmount2 = finalBetAmount2 * BigInt(2);
  
  // Ensure payout doesn't exceed max payout
  const finalPayoutAmount2 = payoutAmount2 < maxPayoutAfterFirstGame ? payoutAmount2 : maxPayoutAfterFirstGame;
  
  console.log(`\n📊 Calculated Bet Amounts for Game 2:`);
  console.log(`   Bet Amount: ${formatEther(finalBetAmount2)} tokens`);
  console.log(`   Payout Amount: ${formatEther(finalPayoutAmount2)} tokens (${formatEther(finalPayoutAmount2 / finalBetAmount2)}x multiplier)\n`);
  
  const seed2 = generateGameSeed();
  
  // Generate death cups for second game
  const deathCups2 = generateAllDeathCups(seed2, rowConfigs);
  const commitmentHash2 = createCommitmentHash(version, deathCups2, seed2);
  const preliminaryId2 = keccak256(toBytes(`preliminary-game-${Date.now()}-2`));

  const { gameId: gameId2 } = await playerClient.createGame(
    preliminaryId2,
    commitmentHash2 as `0x${string}`,
    finalBetAmount2
  );
  console.log(`✓ Game 2 created! Game ID: ${gameId2}\n`);

  // 8. Mark game as lost (backend)
  console.log("❌ Marking Game as Lost (Backend)");
  console.log("-".repeat(50));
  const markLostTx = await backendClient.markGameAsLost(gameId2, seed2 as `0x${string}`);
  console.log(`✓ Mark lost transaction: ${markLostTx}`);

  const game2AfterLost = await playerClient.getGame(gameId2);
  console.log(`Game 2 status: ${formatStatus(game2AfterLost.status)}\n`);

  // 9. Test owner functions
  console.log("👑 Testing Owner Functions");
  console.log("-".repeat(50));

  // Check owner token balance first
  const ownerTokenBalance = await ownerClient.getTokenBalance(ownerAccount.address);
  console.log(`Owner Token Balance: ${formatEther(ownerTokenBalance)} tokens`);

  // Refill pot (add more funds to increase max bet/payout limits)
  // Use 10% of owner balance or 10 tokens, whichever is smaller
  const refillAmountFromBalance = ownerTokenBalance / BigInt(10);
  const refillAmount = refillAmountFromBalance < parseEther("10") 
    ? refillAmountFromBalance 
    : parseEther("10");
  
  if (refillAmount > BigInt(0)) {
    // Approve tokens first
    console.log(`Approving ${formatEther(refillAmount)} tokens for refill...`);
    await ownerClient.approveToken(refillAmount);
    
    console.log(`Refilling pot with ${formatEther(refillAmount)} tokens...`);
    const refillTx = await ownerClient.refillPot(refillAmount);
    console.log(`✓ Refill transaction: ${refillTx}`);

    const potBalanceAfterRefill = await ownerClient.getPotBalance();
    const newMaxBet = await ownerClient.getMaxBet();
    const newMaxPayout = await ownerClient.getMaxPayout();
    console.log(`Pot balance after refill: ${formatEther(potBalanceAfterRefill)} tokens`);
    console.log(`New max bet: ${formatEther(newMaxBet)} tokens`);
    console.log(`New max payout: ${formatEther(newMaxPayout)} tokens\n`);
  } else {
    console.log("⚠️  Owner has insufficient tokens to refill pot\n");
  }

  // Summary
  console.log("=".repeat(50));
  console.log("✅ Interaction Demo Complete!");
  console.log("=".repeat(50));
}

main().catch((error) => {
  console.error("❌ Interaction failed:", error);
  process.exit(1);
});

