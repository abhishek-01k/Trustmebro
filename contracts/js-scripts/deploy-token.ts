import { createWalletClient, createPublicClient, http, type Address, formatUnits, parseUnits, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { anvil, baseSepolia } from "viem/chains";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// Network configuration
const NETWORK = (process.env.NETWORK || "anvil").toLowerCase();
const RPC_URL = process.env.RPC_URL || (NETWORK === "anvil" ? "http://localhost:8545" : undefined);
const PRIVATE_KEY = process.env.PRIVATE_KEY || (NETWORK === "anvil" 
  ? "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" // Anvil account #0
  : undefined);
const PLAYER_PRIVATE_KEY = process.env.PLAYER_PRIVATE_KEY || (NETWORK === "anvil"
  ? "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" // Anvil account #1
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

const TOKEN_JSON_PATH = join(__dirname, "../out/ERC20Mock.sol/ERC20Mock.json");
const DEPLOYED_TOKEN_FILE = join(__dirname, "../.deployed-token.json");

interface DeployedToken {
  address: string;
  chainId: number;
  deployedAt: string;
}

// Standard ERC20 ABI for token operations
const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: "account", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
] as const;

/**
 * Load the ERC20Mock ABI and bytecode from the compiled JSON file
 */
function loadTokenContract() {
  try {
    const contractJson = JSON.parse(readFileSync(TOKEN_JSON_PATH, "utf-8"));
    return {
      abi: contractJson.abi,
      bytecode: contractJson.bytecode.object as string,
    };
  } catch (error) {
    throw new Error(
      `Failed to load ERC20Mock contract from ${TOKEN_JSON_PATH}. Make sure the contract is compiled with 'forge build'`
    );
  }
}

/**
 * Save the deployed token address to a JSON file
 */
function saveDeployedToken(address: string, chainId: number): void {
  const data: DeployedToken = {
    address,
    chainId,
    deployedAt: new Date().toISOString(),
  };
  writeFileSync(DEPLOYED_TOKEN_FILE, JSON.stringify(data, null, 2));
  console.log(`✓ Saved deployed token address to ${DEPLOYED_TOKEN_FILE}`);
}

/**
 * Load the deployed token address from the JSON file
 */
export function loadDeployedToken(): DeployedToken | null {
  if (!existsSync(DEPLOYED_TOKEN_FILE)) {
    return null;
  }
  try {
    const data = JSON.parse(readFileSync(DEPLOYED_TOKEN_FILE, "utf-8"));
    return data as DeployedToken;
  } catch (error) {
    console.warn(`Failed to load deployed token address from ${DEPLOYED_TOKEN_FILE}`);
    return null;
  }
}

async function main() {
  console.log(`🚀 Deploying ERC20Mock token to ${chain.name}...\n`);

  // Validate configuration
  if (!PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY environment variable is required");
    console.error("   Please set PRIVATE_KEY to your deployer wallet private key");
    console.error("   Example: PRIVATE_KEY=0x... NETWORK=base-sepolia pnpm scripts:deploy-token");
    process.exit(1);
  }

  if (!RPC_URL) {
    console.error("❌ RPC_URL environment variable is required for this network");
    console.error(`   Please set RPC_URL to a ${chain.name} RPC endpoint`);
    console.error("   Example: RPC_URL=https://... NETWORK=base-sepolia pnpm scripts:deploy-token");
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
  const { abi, bytecode } = loadTokenContract();

  // Deploy contract (ERC20Mock has no constructor arguments)
  console.log("📦 Deploying ERC20Mock token...");
  const hash = await walletClient.deployContract({
    abi,
    bytecode: bytecode as `0x${string}`,
    account,
    chain,
    args: [],
  });

  console.log(`✓ Deployment transaction: ${hash}`);

  // Wait for deployment
  console.log("⏳ Waiting for confirmation...");
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const tokenAddress = receipt.contractAddress;

  if (!tokenAddress) {
    throw new Error("Token deployment failed - no address in receipt");
  }

  console.log(`\n✅ Token deployed at: ${tokenAddress}\n`);

  // Save deployment address
  saveDeployedToken(tokenAddress, chain.id);

  // Get token info
  const name = (await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "name",
  })) as string;

  const symbol = (await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "symbol",
  })) as string;

  const decimals = (await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "decimals",
  })) as number;

  const totalSupply = (await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "totalSupply",
  })) as bigint;

  // Mint tokens to player and deployer (optional, can be customized via environment variable)
  // Use parseUnits with actual token decimals instead of parseEther (which assumes 18 decimals)
  const mintAmount = process.env.MINT_AMOUNT 
    ? parseUnits(process.env.MINT_AMOUNT, decimals)
    : parseUnits("1000000", decimals); // Default: 1M tokens

  if (!PLAYER_PRIVATE_KEY) {
    console.log("⚠️  PLAYER_PRIVATE_KEY not set, skipping player mint\n");
  } else {
    const playerAccount = privateKeyToAccount(PLAYER_PRIVATE_KEY as `0x${string}`);

    // Mint to player
    console.log(`💰 Minting ${formatUnits(mintAmount, decimals)} ${symbol} to player (${playerAccount.address})...`);
    const playerMintHash = await walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "mint",
      args: [playerAccount.address, mintAmount],
      account,
      chain,
    });
    await publicClient.waitForTransactionReceipt({ hash: playerMintHash });
    console.log("✓ Tokens minted to player\n");
  }

  // Mint to deployer/owner (for refilling pot)
  // Small delay to ensure previous transaction is fully processed
  await new Promise((resolve) => setTimeout(resolve, 100));
  console.log(`💰 Minting ${formatUnits(mintAmount, decimals)} ${symbol} to deployer/owner (${account.address})...`);
  const deployerMintHash = await walletClient.writeContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "mint",
    args: [account.address, mintAmount],
    account,
    chain,
  });
  await publicClient.waitForTransactionReceipt({ hash: deployerMintHash });
  console.log("✓ Tokens minted to deployer/owner\n");

  // Get balances
  const deployerBalance = (await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account.address],
  })) as bigint;

  let playerBalance: bigint | undefined;
  if (PLAYER_PRIVATE_KEY) {
    const playerAccount = privateKeyToAccount(PLAYER_PRIVATE_KEY as `0x${string}`);
    playerBalance = (await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [playerAccount.address],
    })) as bigint;
  }

  // Print summary
  console.log("=== Token Deployment Summary ===");
  console.log(`Token Address: ${tokenAddress}`);
  console.log(`Name: ${name}`);
  console.log(`Symbol: ${symbol}`);
  console.log(`Decimals: ${decimals}`);
  console.log(`Total Supply: ${formatUnits(totalSupply, decimals)} ${symbol}`);
  if (PLAYER_PRIVATE_KEY && playerBalance !== undefined) {
    const playerAccount = privateKeyToAccount(PLAYER_PRIVATE_KEY as `0x${string}`);
    console.log(`\nPlayer Address: ${playerAccount.address}`);
    console.log(`Player Balance: ${formatUnits(playerBalance, decimals)} ${symbol}`);
  }
  console.log(`\nDeployer/Owner Address: ${account.address}`);
  console.log(`Deployer/Owner Balance: ${formatUnits(deployerBalance, decimals)} ${symbol}`);
  console.log(`Chain ID: ${chain.id}`);
  console.log(`Network: ${chain.name}`);
  console.log(`Explorer: ${chain.blockExplorers?.default?.url || "N/A"}`);
  if (chain.blockExplorers?.default?.url) {
    console.log(`Token on Explorer: ${chain.blockExplorers.default.url}/address/${tokenAddress}`);
  }
  console.log("\n✅ Token deployment complete!");
  console.log(`\n💡 To use this token, set the TOKEN_ADDRESS environment variable:`);
  console.log(`   export TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`   pnpm scripts:deploy`);
}

// Only run main() if this file is executed directly (not imported)
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Token deployment failed:", error);
    process.exit(1);
  });
}

