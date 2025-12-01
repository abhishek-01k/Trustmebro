import { createWalletClient, createPublicClient, http, decodeEventLog, parseEther, type Address, type Chain } from "viem";
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

async function main() {
  console.log(`🎨 Minting Trust Me Bro NFT on ${chain.name}...\n`);

  // Validate configuration
  if (!PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY environment variable is required");
    console.error("   Please set PRIVATE_KEY to your wallet private key");
    console.error("   Example: PRIVATE_KEY=0x... NETWORK=base-sepolia pnpm scripts:mint-nft");
    process.exit(1);
  }

  if (!RPC_URL) {
    console.error("❌ RPC_URL environment variable is required for this network");
    console.error(`   Please set RPC_URL to a ${chain.name} RPC endpoint`);
    console.error("   Example: RPC_URL=https://... NETWORK=base-sepolia pnpm scripts:mint-nft");
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

  console.log(`✓ Using minter account: ${account.address}\n`);

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

  const totalSupply = (await publicClient.readContract({
    address: nftAddress,
    abi,
    functionName: "totalSupply",
    args: [],
  })) as bigint;

  console.log(`Name: ${name}`);
  console.log(`Symbol: ${symbol}`);
  console.log(`Minting: 0.0005 ETH`);
  console.log(`Total Supply: ${totalSupply}`);
  console.log(`Next Token ID: ${totalSupply + BigInt(1)}\n`);

  // Check if minter already owns an NFT
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

  // Mint the NFT
  console.log("🎨 Minting NFT");
  console.log("-".repeat(50));
  console.log(`Minting NFT for ${account.address}...`);
  console.log(`Price: 0.0005 ETH\n`);

  const mintHash = await walletClient.writeContract({
    address: nftAddress,
    abi,
    functionName: "mint",
    args: [],
    account,
    chain,
    value: parseEther("0.0005"),
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
  const nftBalanceAfter = (await publicClient.readContract({
    address: nftAddress,
    abi,
    functionName: "balanceOf",
    args: [account.address],
  })) as bigint;

  // Get token URI
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

  // Calculate position (tokenId - 1)
  const position = tokenId - BigInt(1);

  // Print summary
  console.log("=".repeat(50));
  console.log("✅ NFT Minted Successfully!");
  console.log("=".repeat(50));
  console.log(`Token ID: ${tokenId}`);
  console.log(`Position: ${position} (for API)`);
  console.log(`Owner: ${account.address}`);
  console.log(`Token URI: ${tokenURI}`);
  console.log(`\nBalance Changes:`);
  console.log(`  NFTs: ${nftBalance} → ${nftBalanceAfter}`);
  console.log(`\nTransaction: ${mintHash}`);
  if (chain.blockExplorers?.default?.url) {
    console.log(`Explorer: ${chain.blockExplorers.default.url}/tx/${mintHash}`);
    console.log(`NFT on Explorer: ${chain.blockExplorers.default.url}/nft/${nftAddress}/${tokenId}`);
  }
  console.log("\n🎉 Congratulations! You now own a Trust Me Bro NFT!");
  console.log(`\n🖼️  View your NFT image at: ${tokenURI}`);
}

main().catch((error) => {
  console.error("❌ NFT minting failed:", error);
  process.exit(1);
});

