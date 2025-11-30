import * as crypto from 'crypto';

/**
 * Generate a random game seed
 * @returns {string} Hex string with 0x prefix (bytes32 format)
 */
export function generateGameSeed(): string {
  return '0x' + crypto.randomBytes(32).toString('hex');
}

/**
 * Get the death cup index for a specific row
 * @param {string} seed - The game seed
 * @param {number} rowIndex - The row index (0-based)
 * @param {number} totalCups - Total number of cups in this row
 * @returns {number} The death cup index (0 to totalCups-1)
 */
export function getDeathCupIndex(seed: string, rowIndex: number, totalCups: number): number {
  // Create unique string for this row
  const hashSource = `${seed}-row${rowIndex}`;
  
  // Generate SHA-256 hash
  const hash = crypto.createHash('sha256').update(hashSource).digest('hex');
  
  // Convert first 8 hex characters to number
  const numericHash = parseInt(hash.slice(0, 8), 16);
  
  // Use modulo to get position 0 to totalCups-1
  return numericHash % totalCups;
}

/**
 * Generate all death cup locations for all rows
 * @param {string} seed - The game seed
 * @param {Array} rowConfigs - Array of row configurations with 'tiles' property
 * @returns {Array} Array of death cup objects with row, position, and totalCups
 */
export function generateAllDeathCups(seed: string, rowConfigs: Array<{ tiles: number }>): Array<{ row: number; position: number; totalCups: number }> {
  const deathCups = [];
  
  for (let rowIndex = 0; rowIndex < rowConfigs.length; rowIndex++) {
    const totalCups = rowConfigs[rowIndex].tiles;
    const deathCupIndex = getDeathCupIndex(seed, rowIndex, totalCups);
    
    deathCups.push({
      row: rowIndex,
      position: deathCupIndex,
      totalCups: totalCups,
    });
  }
  
  return deathCups;
}

/**
 * Create a commitment hash from game data
 * @param {string} version - Algorithm version (e.g., "v1")
 * @param {Array} rows - Array of each round's cup configurations
 * @param {string} seed - Random game seed
 * @returns {string} Commitment hash with '0x' prefix
 */
export function createCommitmentHash(version: string, rows: unknown[], seed: string): string {
  const gameData = JSON.stringify({
    version, // Algorithm version (e.g., "v1")
    rows, // Array of each round's cup configurations
    seed, // Random game seed
  });
  
  return '0x' + crypto.createHash('sha256').update(gameData).digest('hex');
}

export function getGameData(version: string, rows: unknown[], seed: string): string {
  return JSON.stringify({
    version, // Algorithm version (e.g., "v1")
    rows, // Array of each round's cup configurations
    seed, // Random game seed
  });
}

/**
 * Verify a commitment hash matches the provided game data
 * @param {string} commitmentHash - The commitment hash to verify
 * @param {string} version - Algorithm version
 * @param {Array} rows - Array of row configurations
 * @param {string} seed - The game seed
 * @returns {boolean} True if the hash matches
 */
export function verifyCommitmentHash(commitmentHash: string, version: string, rows: unknown[], seed: string): boolean {
  const computedHash = createCommitmentHash(version, rows, seed);
  return computedHash.toLowerCase() === commitmentHash.toLowerCase();
}