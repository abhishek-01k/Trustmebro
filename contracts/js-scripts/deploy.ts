import { createWalletClient, createPublicClient, http, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { anvil } from "viem/chains";
import {
  loadContractABI,
  loadContractBytecode,
  saveDeployedAddress,
} from "./utils/contract-utils";

const ANVIL_RPC_URL = "http://localhost:8545";
const ANVIL_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Anvil account #0

async function main() {
  console.log("🚀 Deploying MultiplierGame contract to Anvil...\n");

  // Check if Anvil is running
  try {
    const publicClient = createPublicClient({
      chain: anvil,
      transport: http(ANVIL_RPC_URL),
    });
    await publicClient.getBlockNumber();
    console.log("✓ Connected to Anvil at", ANVIL_RPC_URL);
  } catch (error) {
    console.error("❌ Failed to connect to Anvil. Make sure it's running:");
    console.error("   pnpm contracts:anvil");
    process.exit(1);
  }

  // Create account and clients
  const account = privateKeyToAccount(ANVIL_PRIVATE_KEY as `0x${string}`);
  const publicClient = createPublicClient({
    chain: anvil,
    transport: http(ANVIL_RPC_URL),
  });
  const walletClient = createWalletClient({
    account,
    chain: anvil,
    transport: http(ANVIL_RPC_URL),
  });

  console.log(`✓ Using deployer account: ${account.address}\n`);

  // Load contract ABI and bytecode
  const abi = loadContractABI();
  const bytecode = loadContractBytecode();

  // Deploy contract
  console.log("📦 Deploying contract...");
  const hash = await walletClient.deployContract({
    abi,
    bytecode: bytecode as `0x${string}`,
    account,
    chain: anvil,
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
  saveDeployedAddress(contractAddress, anvil.id);

  // Fund initial pot (100 ETH)
  console.log("💰 Funding initial pot with 100 ETH...");
  const fundHash = await walletClient.writeContract({
    address: contractAddress,
    abi,
    functionName: "refillPot",
    account,
    chain: anvil,
    value: BigInt("1000000000000000000"), // 1 ETH
  });

  await publicClient.waitForTransactionReceipt({ hash: fundHash });
  console.log("✓ Pot funded\n");

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

  // Print summary
  console.log("=== Deployment Summary ===");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Owner: ${owner}`);
  console.log(`Pot Balance: ${formatEther(potBalance)} ETH`);
  console.log(`Max Bet: ${formatEther(maxBet)} ETH`);
  console.log(`Max Payout: ${formatEther(maxPayout)} ETH`);
  console.log(`Chain ID: ${anvil.id}`);
  console.log("\n✅ Deployment complete!");
}

function formatEther(wei: bigint): string {
  return (Number(wei) / 1e18).toFixed(4);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});

