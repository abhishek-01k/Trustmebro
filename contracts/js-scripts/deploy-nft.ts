import { createWalletClient, createPublicClient, http, type Address, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { anvil, baseSepolia } from "viem/chains";
import {
  loadNFTContractABI,
  loadNFTContractBytecode,
  saveDeployedNFTAddress,
} from "./utils/nft-utils";

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

async function main() {
  console.log(`🚀 Deploying TrustMeBroNFT contract to ${chain.name}...\n`);

  // Validate configuration
  if (!PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY environment variable is required");
    console.error("   Please set PRIVATE_KEY to your deployer wallet private key");
    console.error("   Example: PRIVATE_KEY=0x... NETWORK=base-sepolia pnpm scripts:deploy-nft");
    process.exit(1);
  }

  if (!RPC_URL) {
    console.error("❌ RPC_URL environment variable is required for this network");
    console.error(`   Please set RPC_URL to a ${chain.name} RPC endpoint`);
    console.error("   Example: RPC_URL=https://... NETWORK=base-sepolia pnpm scripts:deploy-nft");
    process.exit(1);
  }

  // Get configuration from environment
  const paymentTokenAddress = (process.env.PAYMENT_TOKEN_ADDRESS as Address) || undefined;
  if (!paymentTokenAddress) {
    console.error("❌ PAYMENT_TOKEN_ADDRESS environment variable is required");
    console.error("   Please set PAYMENT_TOKEN_ADDRESS to the USDC token address");
    console.error("   Example: PAYMENT_TOKEN_ADDRESS=0x... pnpm scripts:deploy-nft");
    process.exit(1);
  }

  const mintPrice = process.env.MINT_PRICE || "10000000"; // Default: 10 USDC (6 decimals)
  const baseURI = process.env.BASE_URI || "https://api.trustmebro.com/nft/";

  console.log(`✓ Payment Token (USDC): ${paymentTokenAddress}`);
  console.log(`✓ Mint Price: ${mintPrice} (${formatUSDC(mintPrice)} USDC)`);
  console.log(`✓ Base URI: ${baseURI}\n`);

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
  const abi = loadNFTContractABI();
  const bytecode = loadNFTContractBytecode();

  // Deploy contract with constructor arguments
  console.log("📦 Deploying NFT contract...");
  const hash = await walletClient.deployContract({
    abi,
    bytecode: bytecode as `0x${string}`,
    account,
    chain,
    args: [paymentTokenAddress, BigInt(mintPrice), baseURI] as readonly unknown[],
  });

  console.log(`✓ Deployment transaction: ${hash}`);

  // Wait for deployment
  console.log("⏳ Waiting for confirmation...");
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const contractAddress = receipt.contractAddress;

  if (!contractAddress) {
    throw new Error("Contract deployment failed - no address in receipt");
  }

  console.log(`\n✅ NFT contract deployed at: ${contractAddress}\n`);

  // Save deployment address
  saveDeployedNFTAddress(contractAddress, chain.id);

  // Get contract state
  const name = (await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: "name",
    args: [],
  })) as string;

  const symbol = (await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: "symbol",
    args: [],
  })) as string;

  const currentMintPrice = (await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: "mintPrice",
    args: [],
  })) as bigint;

  const paymentToken = (await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: "PAYMENT_TOKEN",
    args: [],
  })) as Address;

  const owner = (await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: "owner",
    args: [],
  })) as Address;

  const totalSupply = (await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: "totalSupply",
    args: [],
  })) as bigint;

  // Print summary
  console.log("=== Deployment Summary ===");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Name: ${name}`);
  console.log(`Symbol: ${symbol}`);
  console.log(`Payment Token: ${paymentToken}`);
  console.log(`Mint Price: ${formatUSDC(currentMintPrice.toString())} USDC`);
  console.log(`Owner: ${owner}`);
  console.log(`Total Supply: ${totalSupply}`);
  console.log(`Chain ID: ${chain.id}`);
  console.log(`Network: ${chain.name}`);
  console.log(`Explorer: ${chain.blockExplorers?.default?.url || "N/A"}`);
  if (chain.blockExplorers?.default?.url) {
    console.log(`Contract on Explorer: ${chain.blockExplorers.default.url}/address/${contractAddress}`);
  }
  console.log("\n✅ Deployment complete!");
}

function formatUSDC(amount: string): string {
  // USDC has 6 decimals
  const num = Number(amount) / 1e6;
  return num.toFixed(2);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});

