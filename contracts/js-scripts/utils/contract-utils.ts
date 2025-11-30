import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { Abi } from "viem";

const DEPLOYED_ADDRESS_FILE = join(__dirname, "../.deployed-address.json");
const CONTRACT_JSON_PATH = join(__dirname, "../../out/MultiplierGame.sol/MultiplierGame.json");

export interface DeployedAddress {
  address: string;
  chainId: number;
  deployedAt: string;
}

/**
 * Load the contract ABI from the compiled JSON file
 */
export function loadContractABI(): Abi {
  try {
    const contractJson = JSON.parse(readFileSync(CONTRACT_JSON_PATH, "utf-8"));
    return contractJson.abi as Abi;
  } catch (error) {
    throw new Error(
      `Failed to load contract ABI from ${CONTRACT_JSON_PATH}. Make sure the contract is compiled with 'forge build'`
    );
  }
}

/**
 * Load the contract bytecode from the compiled JSON file
 */
export function loadContractBytecode(): string {
  try {
    const contractJson = JSON.parse(readFileSync(CONTRACT_JSON_PATH, "utf-8"));
    return contractJson.bytecode.object as string;
  } catch (error) {
    throw new Error(
      `Failed to load contract bytecode from ${CONTRACT_JSON_PATH}. Make sure the contract is compiled with 'forge build'`
    );
  }
}

/**
 * Save the deployed contract address to a JSON file
 */
export function saveDeployedAddress(address: string, chainId: number): void {
  const data: DeployedAddress = {
    address,
    chainId,
    deployedAt: new Date().toISOString(),
  };
  writeFileSync(DEPLOYED_ADDRESS_FILE, JSON.stringify(data, null, 2));
  console.log(`✓ Saved deployed address to ${DEPLOYED_ADDRESS_FILE}`);
}

/**
 * Load the deployed contract address from the JSON file
 */
export function loadDeployedAddress(): DeployedAddress | null {
  if (!existsSync(DEPLOYED_ADDRESS_FILE)) {
    return null;
  }
  try {
    const data = JSON.parse(readFileSync(DEPLOYED_ADDRESS_FILE, "utf-8"));
    return data as DeployedAddress;
  } catch (error) {
    console.warn(`Failed to load deployed address from ${DEPLOYED_ADDRESS_FILE}`);
    return null;
  }
}

/**
 * Get the deployed address or throw if not found
 */
export function getDeployedAddress(): string {
  const deployed = loadDeployedAddress();
  if (!deployed) {
    throw new Error(
      `No deployed address found. Please deploy the contract first using 'pnpm scripts:deploy'`
    );
  }
  return deployed.address;
}


