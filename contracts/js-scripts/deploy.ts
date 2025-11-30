import { createWalletClient, createPublicClient, http, type Address, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { anvil, baseSepolia } from "viem/chains";
import {
  loadContractABI,
  loadContractBytecode,
  saveDeployedAddress,
} from "./utils/contract-utils";

// Network configuration
const NETWORK = (process.env.NETWORK || "anvil").toLowerCase();
const RPC_URL = process.env.RPC_URL || (NETWORK === "anvil" ? "http://localhost:8545" : undefined);
const PRIVATE_KEY = process.env.PRIVATE_KEY || (NETWORK === "anvil" 
  ? "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" // Anvil account #0
  : undefined);

// Get chain configuration
function getChain(): Chain {
  switch (NETWORK) {
    case "base-sepolia":
    case "basesepolia":
      return baseSepolia;
    case "anvil":
    default:
      return anvil;
  }
}

const chain = getChain();

// Standard ERC20 ABI for token operations
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
] as const;

async function main() {
  console.log(`🚀 Deploying MultiplierGame contract to ${chain.name}...\n`);

  // Validate configuration
  if (!PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY environment variable is required");
    console.error("   Please set PRIVATE_KEY to your deployer wallet private key");
    console.error("   Example: PRIVATE_KEY=0x... NETWORK=base-sepolia pnpm scripts:deploy");
    process.exit(1);
  }

  if (!RPC_URL) {
    console.error("❌ RPC_URL environment variable is required for this network");
    console.error(`   Please set RPC_URL to a ${chain.name} RPC endpoint`);
    console.error("   Example: RPC_URL=https://... NETWORK=base-sepolia pnpm scripts:deploy");
    process.exit(1);
  }

  // Get token address from environment
  const tokenAddress = (process.env.TOKEN_ADDRESS as Address) || undefined;
  if (!tokenAddress) {
    console.error("❌ TOKEN_ADDRESS environment variable is required");
    console.error("   Please set TOKEN_ADDRESS to an ERC20 token address");
    console.error("   Example: TOKEN_ADDRESS=0x... pnpm scripts:deploy");
    process.exit(1);
  }

  // Connect to network
  try {
    const publicClient = createPublicClient({
      chain,
      transport: http(RPC_URL),
    });
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`✓ Connected to ${chain.name} at ${RPC_URL}`);
    console.log(`✓ Current block: ${blockNumber}\n`);
  } catch (error) {
    console.error(`❌ Failed to connect to ${chain.name}:`);
    if (NETWORK === "anvil") {
      console.error("   Make sure Anvil is running: pnpm contracts:anvil");
    } else {
      console.error("   Check your RPC_URL and network configuration");
    }
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // Create account and clients
  const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
  const publicClient = createPublicClient({
    chain,
    transport: http(RPC_URL),
  });
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(RPC_URL),
  });

  console.log(`✓ Using deployer account: ${account.address}\n`);

  // Load contract ABI and bytecode
  const abi = loadContractABI();
  const bytecode = loadContractBytecode();

  console.log(`✓ Token address: ${tokenAddress}\n`);

  // Deploy contract with token address as constructor argument
  console.log("📦 Deploying contract...");
  const hash = await walletClient.deployContract({
    abi,
    bytecode: bytecode as `0x${string}`,
    account,
    chain,
    args: [tokenAddress],
  });

  console.log(`✓ Deployment transaction: ${hash}`);

  // Wait for deployment
  console.log("⏳ Waiting for confirmation...");
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const contractAddress = receipt.contractAddress;

  if (!contractAddress) {
    throw new Error("Contract deployment failed - no address in receipt");
  }

  console.log(`\n✅ Contract deployed at: ${contractAddress}\n`);

  // Save deployment address
  saveDeployedAddress(contractAddress, chain.id);

  // Check deployer token balance
  const deployerBalance = (await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account.address],
  })) as bigint;

  console.log(`💰 Deployer token balance: ${formatEther(deployerBalance)} tokens`);

  // Fund initial pot if deployer has tokens
  const refillAmount = BigInt("100000000000000000000"); // 100 tokens
  if (deployerBalance >= refillAmount) {
    console.log(`💰 Funding initial pot with ${formatEther(refillAmount)} tokens...`);
    
    // First, approve the contract to spend tokens
    const approveHash = await walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [contractAddress, refillAmount],
      account,
      chain,
    });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
    console.log("✓ Token approval confirmed");

    // Then, refill the pot
    const fundHash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName: "refillPot",
      args: [refillAmount],
      account,
      chain,
    });

    await publicClient.waitForTransactionReceipt({ hash: fundHash });
    console.log("✓ Pot funded\n");
  } else {
    console.log(`⚠️  Deployer has insufficient tokens to fund pot (need ${formatEther(refillAmount)}, have ${formatEther(deployerBalance)})`);
    console.log(`   The pot can be funded later by the owner using refillPot()\n`);
  }

  // Get contract state
  const potBalance = (await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: "getPotBalance",
  })) as bigint;

  const maxBet = (await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: "getMaxBet",
  })) as bigint;

  const maxPayout = (await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: "getMaxPayout",
  })) as bigint;

  const owner = (await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: "owner",
  })) as Address;

  // Get token address from contract
  const tokenAddr = (await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: "token",
  })) as Address;

  // Print summary
  console.log("=== Deployment Summary ===");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Token Address: ${tokenAddr}`);
  console.log(`Owner: ${owner}`);
  console.log(`Pot Balance: ${formatEther(potBalance)} tokens`);
  console.log(`Max Bet: ${formatEther(maxBet)} tokens`);
  console.log(`Max Payout: ${formatEther(maxPayout)} tokens`);
  console.log(`Chain ID: ${chain.id}`);
  console.log(`Network: ${chain.name}`);
  console.log(`Explorer: ${chain.blockExplorers?.default?.url || "N/A"}`);
  if (chain.blockExplorers?.default?.url) {
    console.log(`Contract on Explorer: ${chain.blockExplorers.default.url}/address/${contractAddress}`);
  }
  console.log("\n✅ Deployment complete!");
}

function formatEther(wei: bigint): string {
  return (Number(wei) / 1e18).toFixed(4);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});

