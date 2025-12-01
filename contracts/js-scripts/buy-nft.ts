import { createWalletClient, createPublicClient, http, decodeEventLog, type Address, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { anvil, baseSepolia } from "viem/chains";
import { loadDeployedNFTAddress, loadNFTContractABI } from "./utils/nft-utils";

// Network configuration
const NETWORK = (process.env.NETWORK || "anvil").toLowerCase();
const RPC_URL = process.env.RPC_URL || (NETWORK === "anvil" ? "http://localhost:8545" : undefined);
const PRIVATE_KEY = process.env.PRIVATE_KEY || (NETWORK === "anvil" 
  ? "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" // Anvil account #1 (player)
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
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
] as const;

function formatUSDC(amount: string | bigint): string {
  // USDC has 6 decimals
  const num = typeof amount === "string" ? Number(amount) : Number(amount);
  return (num / 1e6).toFixed(2);
}

async function main() {
  console.log(`🛒 Buying Trust Me Bro NFT on ${chain.name}...\n`);

  // Validate configuration
  if (!PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY environment variable is required");
    console.error("   Please set PRIVATE_KEY to your wallet private key");
    console.error("   Example: PRIVATE_KEY=0x... NETWORK=base-sepolia pnpm scripts:buy-nft");
    process.exit(1);
  }

  if (!RPC_URL) {
    console.error("❌ RPC_URL environment variable is required for this network");
    console.error(`   Please set RPC_URL to a ${chain.name} RPC endpoint`);
    console.error("   Example: RPC_URL=https://... NETWORK=base-sepolia pnpm scripts:buy-nft");
    process.exit(1);
  }

  // Load deployed NFT contract
  const deployedNFT = loadDeployedNFTAddress();
  if (!deployedNFT) {
    console.error("❌ No deployed NFT contract found. Please deploy the contract first:");
    console.error("   pnpm scripts:deploy-nft");
    process.exit(1);
  }

  const nftAddress = deployedNFT.address as Address;
  console.log(`✓ NFT Contract Address: ${nftAddress}\n`);

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

  console.log(`✓ Using buyer account: ${account.address}\n`);

  // Load contract ABI
  const abi = loadNFTContractABI();

  // Get contract state
  console.log("📊 NFT Contract Information");
  console.log("-".repeat(50));
  
  const name = (await publicClient.readContract({
    address: nftAddress,
    abi,
    functionName: "name",
    args: [],
  })) as string;

  const symbol = (await publicClient.readContract({
    address: nftAddress,
    abi,
    functionName: "symbol",
    args: [],
  })) as string;

  const mintPrice = (await publicClient.readContract({
    address: nftAddress,
    abi,
    functionName: "mintPrice",
    args: [],
  })) as bigint;

  const paymentToken = (await publicClient.readContract({
    address: nftAddress,
    abi,
    functionName: "PAYMENT_TOKEN",
    args: [],
  })) as Address;

  const totalSupply = (await publicClient.readContract({
    address: nftAddress,
    abi,
    functionName: "totalSupply",
    args: [],
  })) as bigint;

  console.log(`Name: ${name}`);
  console.log(`Symbol: ${symbol}`);
  console.log(`Mint Price: ${formatUSDC(mintPrice)} USDC`);
  console.log(`Payment Token: ${paymentToken}`);
  console.log(`Total Supply: ${totalSupply}`);
  console.log(`Next Token ID: ${totalSupply + BigInt(1)}\n`);

  // Check buyer's USDC balance
  console.log("💰 Buyer Balance Check");
  console.log("-".repeat(50));
  
  const buyerBalance = (await publicClient.readContract({
    address: paymentToken,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account.address],
  })) as bigint;

  console.log(`Buyer USDC Balance: ${formatUSDC(buyerBalance)} USDC`);

  if (buyerBalance < mintPrice) {
    console.error(`❌ Insufficient balance! Need ${formatUSDC(mintPrice)} USDC, have ${formatUSDC(buyerBalance)} USDC`);
    process.exit(1);
  }

  // Check if buyer already owns an NFT
  const hasNft = (await publicClient.readContract({
    address: nftAddress,
    abi,
    functionName: "hasNft",
    args: [account.address],
  })) as boolean;

  const nftBalance = (await publicClient.readContract({
    address: nftAddress,
    abi,
    functionName: "balanceOf",
    args: [account.address],
  })) as bigint;

  console.log(`Already owns NFT: ${hasNft}`);
  console.log(`Current NFT balance: ${nftBalance}\n`);

  // Check allowance
  console.log("🔐 Checking Token Approval");
  console.log("-".repeat(50));
  
  const allowance = (await publicClient.readContract({
    address: paymentToken,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account.address, nftAddress],
  })) as bigint;

  console.log(`Current allowance: ${formatUSDC(allowance)} USDC`);

  // Approve tokens if needed
  if (allowance < mintPrice) {
    console.log(`\n📝 Approving ${formatUSDC(mintPrice)} USDC for NFT contract...`);
    
    const approveHash = await walletClient.writeContract({
      address: paymentToken,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [nftAddress, mintPrice],
      account,
      chain,
    });

    console.log(`✓ Approval transaction: ${approveHash}`);
    console.log("⏳ Waiting for confirmation...");
    
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
    console.log("✓ Approval confirmed\n");
  } else {
    console.log("✓ Sufficient allowance already set\n");
  }

  // Mint the NFT
  console.log("🎨 Minting NFT");
  console.log("-".repeat(50));
  console.log(`Minting NFT for ${account.address}...`);
  console.log(`Price: ${formatUSDC(mintPrice)} USDC\n`);

  const mintHash = await walletClient.writeContract({
    address: nftAddress,
    abi,
    functionName: "mint",
    args: [],
    account,
    chain,
  });

  console.log(`✓ Mint transaction: ${mintHash}`);
  console.log("⏳ Waiting for confirmation...");

  const receipt = await publicClient.waitForTransactionReceipt({ hash: mintHash });
  console.log("✓ NFT minted successfully!\n");

  // Get the token ID from events
  const mintEvent = receipt.logs.find((log) => {
    try {
      const decoded = decodeEventLog({
        abi,
        data: log.data,
        topics: log.topics,
      });
      return decoded.eventName === "NFTMinted";
    } catch {
      return false;
    }
  });

  let tokenId: bigint | null = null;
  if (mintEvent) {
    try {
      const decoded = decodeEventLog({
        abi,
        data: mintEvent.data,
        topics: mintEvent.topics,
      });
      tokenId = (decoded.args as any).tokenId as bigint;
    } catch (error) {
      console.warn("⚠️  Could not decode mint event, fetching from contract state...");
    }
  }

  // If we couldn't get token ID from event, calculate it
  if (!tokenId) {
    const newTotalSupply = (await publicClient.readContract({
      address: nftAddress,
      abi,
      functionName: "totalSupply",
      args: [],
    })) as bigint;
    tokenId = newTotalSupply;
  }

  // Get updated balances
  const buyerBalanceAfter = (await publicClient.readContract({
    address: paymentToken,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account.address],
  })) as bigint;

  const nftBalanceAfter = (await publicClient.readContract({
    address: nftAddress,
    abi,
    functionName: "balanceOf",
    args: [account.address],
  })) as bigint;

  // Get token URI if available
  let tokenURI = "";
  try {
    tokenURI = (await publicClient.readContract({
      address: nftAddress,
      abi,
      functionName: "tokenURI",
      args: [tokenId],
    })) as string;
  } catch (error) {
    console.warn("⚠️  Could not fetch token URI");
  }

  // Print summary
  console.log("=".repeat(50));
  console.log("✅ NFT Purchase Complete!");
  console.log("=".repeat(50));
  console.log(`Token ID: ${tokenId}`);
  console.log(`Owner: ${account.address}`);
  console.log(`Token URI: ${tokenURI || "N/A"}`);
  console.log(`\nBalance Changes:`);
  console.log(`  USDC: ${formatUSDC(buyerBalance)} → ${formatUSDC(buyerBalanceAfter)} (spent ${formatUSDC(buyerBalance - buyerBalanceAfter)})`);
  console.log(`  NFTs: ${nftBalance} → ${nftBalanceAfter}`);
  console.log(`\nTransaction: ${mintHash}`);
  if (chain.blockExplorers?.default?.url) {
    console.log(`Explorer: ${chain.blockExplorers.default.url}/tx/${mintHash}`);
  }
  console.log("\n🎉 Congratulations! You now own a Trust Me Bro NFT!");
}

main().catch((error) => {
  console.error("❌ NFT purchase failed:", error);
  process.exit(1);
});

