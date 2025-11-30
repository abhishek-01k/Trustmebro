import { keccak256, encodePacked } from 'viem';
import crypto from 'crypto';

/**
 * Row configuration for a game
 */
export interface RowConfig {
  tiles: number; // Total tiles in row (e.g., 5)
  deathTiles: number; // Death tiles in row (e.g., 1)
}

/**
 * Complete game configuration
 */
export interface GameConfig {
  version: string;
  rows: RowConfig[];
  deathCupPositions: number[];
  multipliers: number[];
}

/**
 * Generate cryptographically secure game seed
 * @returns 32-byte hex string starting with 0x
 */
export function generateGameSeed(): `0x${string}` {
  const randomBytes = crypto.randomBytes(32);
  return `0x${randomBytes.toString('hex')}` as `0x${string}`;
}

/**
 * Calculate death cup position for a specific row
 * Uses deterministic hash derivation from seed
 * @param seed - The game seed
 * @param rowIndex - The row index (0-based)
 * @param totalTiles - Total number of tiles in the row
 * @returns The index of the death cup (0-based)
 */
export function getDeathCupIndex(
  seed: `0x${string}`,
  rowIndex: number,
  totalTiles: number
): number {
  const hash = keccak256(
    encodePacked(['bytes32', 'uint256'], [seed, BigInt(rowIndex)])
  );
  const hashBigInt = BigInt(hash);
  return Number(hashBigInt % BigInt(totalTiles));
}

/**
 * Generate death cup positions for all rows
 * @param seed - The game seed
 * @param rowConfigs - Array of row configurations
 * @returns Array of death cup indices for each row
 */
export function generateDeathCups(
  seed: `0x${string}`,
  rowConfigs: RowConfig[]
): number[] {
  return rowConfigs.map((config, index) =>
    getDeathCupIndex(seed, index, config.tiles)
  );
}

/**
 * Calculate multiplier for a single row
 * Formula: 1 / (1 - deathTiles/totalTiles)
 * @param config - Row configuration
 * @returns The multiplier for surviving this row
 */
export function calculateRowMultiplier(config: RowConfig): number {
  const survivalRate = (config.tiles - config.deathTiles) / config.tiles;
  return 1 / survivalRate;
}

/**
 * Calculate cumulative multiplier up to a specific row
 * @param rowConfigs - Array of row configurations
 * @param upToRow - Number of rows completed (1-based count)
 * @returns Cumulative multiplier
 */
export function calculateCumulativeMultiplier(
  rowConfigs: RowConfig[],
  upToRow: number
): number {
  let multiplier = 1;
  for (let i = 0; i < upToRow && i < rowConfigs.length; i++) {
    multiplier *= calculateRowMultiplier(rowConfigs[i]);
  }
  return multiplier;
}

/**
 * Apply house edge (RTP - Return To Player) to multiplier
 * Default RTP = 95% (house edge = 5%)
 * @param multiplier - The raw multiplier
 * @param rtp - Return to player percentage (default 0.95)
 * @returns Adjusted multiplier
 */
export function applyRTP(multiplier: number, rtp: number = 0.95): number {
  return multiplier * rtp;
}

/**
 * Calculate final payout amount
 * Uses fixed-point math for precision
 * @param betAmount - The bet amount in wei
 * @param multiplier - The multiplier to apply
 * @returns Payout amount in wei
 */
export function calculatePayout(betAmount: bigint, multiplier: number): bigint {
  // Use basis points (10000 = 1x) for precision
  const multiplierBPS = BigInt(Math.floor(multiplier * 10000));
  return (betAmount * multiplierBPS) / BigInt(10000);
}

/**
 * Create commitment hash for on-chain verification
 * @param seed - The game seed
 * @param payoutAmount - The payout amount
 * @returns keccak256 hash of seed and payout
 */
export function createCommitmentHash(
  seed: `0x${string}`,
  payoutAmount: bigint
): `0x${string}` {
  return keccak256(
    encodePacked(['bytes32', 'uint256'], [seed, payoutAmount])
  );
}

/**
 * Create full game configuration
 * @param seed - The game seed
 * @param rowConfigs - Array of row configurations
 * @returns Complete game configuration
 */
export function createGameConfig(
  seed: `0x${string}`,
  rowConfigs: RowConfig[]
): GameConfig {
  const deathCupPositions = generateDeathCups(seed, rowConfigs);
  const multipliers = rowConfigs.map(calculateRowMultiplier);

  return {
    version: 'v1',
    rows: rowConfigs,
    deathCupPositions,
    multipliers,
  };
}

/**
 * Verify commitment hash matches revealed data
 * @param commitmentHash - The stored commitment hash
 * @param seed - The revealed seed
 * @param payoutAmount - The revealed payout amount
 * @returns True if commitment is valid
 */
export function verifyCommitment(
  commitmentHash: `0x${string}`,
  seed: `0x${string}`,
  payoutAmount: bigint
): boolean {
  const calculatedHash = createCommitmentHash(seed, payoutAmount);
  return commitmentHash === calculatedHash;
}
