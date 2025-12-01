import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { Abi } from "viem";

const DEPLOYED_ADDRESS_FILE = join(__dirname, "../.deployed-nft-address.json");
const CONTRACT_JSON_PATH = join(__dirname, "../../out/TrustMeBroNFT.sol/TrustMeBroNFT.json");

export interface DeployedAddress {
  address: string;
  chainId: number;
  deployedAt: string;
}

/**
 * Load the NFT contract ABI from the compiled JSON file
 */
export function loadNFTContractABI(): Abi {
  try {
    const contractJson = JSON.parse(readFileSync(CONTRACT_JSON_PATH, "utf-8"));
    return contractJson.abi as Abi;
  } catch (error) {
    throw new Error(
      `Failed to load NFT contract ABI from ${CONTRACT_JSON_PATH}. Make sure the contract is compiled with 'forge build'`
    );
  }
}

/**
 * Load the NFT contract bytecode from the compiled JSON file
 */
export function loadNFTContractBytecode(): string {
  try {
    const contractJson = JSON.parse(readFileSync(CONTRACT_JSON_PATH, "utf-8"));
    return contractJson.bytecode.object as string;
  } catch (error) {
    throw new Error(
      `Failed to load NFT contract bytecode from ${CONTRACT_JSON_PATH}. Make sure the contract is compiled with 'forge build'`
    );
  }
}

/**
 * Save the deployed NFT contract address to a JSON file
 */
export function saveDeployedNFTAddress(address: string, chainId: number): void {
  const data: DeployedAddress = {
    address,
    chainId,
    deployedAt: new Date().toISOString(),
  };
  writeFileSync(DEPLOYED_ADDRESS_FILE, JSON.stringify(data, null, 2));
  console.log(`✓ Saved deployed NFT address to ${DEPLOYED_ADDRESS_FILE}`);
}

/**
 * Load the deployed NFT contract address from the JSON file
 */
export function loadDeployedNFTAddress(): DeployedAddress | null {
  if (!existsSync(DEPLOYED_ADDRESS_FILE)) {
    return null;
  }
  try {
    const data = JSON.parse(readFileSync(DEPLOYED_ADDRESS_FILE, "utf-8"));
    return data as DeployedAddress;
  } catch (error) {
    console.warn(`Failed to load deployed NFT address from ${DEPLOYED_ADDRESS_FILE}`);
    return null;
  }
}

/**
 * Get the deployed NFT address or throw if not found
 */
export function getDeployedNFTAddress(): string {
  const deployed = loadDeployedNFTAddress();
  if (!deployed) {
    throw new Error(
      `No deployed NFT address found. Please deploy the contract first using 'pnpm scripts:deploy-nft'`
    );
  }
  return deployed.address;
}

