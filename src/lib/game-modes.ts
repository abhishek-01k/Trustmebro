import { calculateCumulativeMultiplier, applyRTP, type RowConfig } from './game-engine';

/**
 * Available game mode types
 */
export type GameModeType = 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';

/**
 * Preset game mode configurations
 * Each mode has different risk/reward profiles
 */
export const GAME_MODES: Record<GameModeType, RowConfig[]> = {
  // Easy mode: 3 rows, lower risk
  // Max multiplier: ~4x (3.8x after RTP)
  EASY: [
    { tiles: 4, deathTiles: 1 }, // 1.33x
    { tiles: 3, deathTiles: 1 }, // 1.5x
    { tiles: 2, deathTiles: 1 }, // 2x
  ],

  // Medium mode: 5 rows, moderate risk
  // Max multiplier: ~6.67x (6.33x after RTP)
  MEDIUM: [
    { tiles: 5, deathTiles: 1 }, // 1.25x
    { tiles: 4, deathTiles: 1 }, // 1.33x
    { tiles: 4, deathTiles: 1 }, // 1.33x
    { tiles: 3, deathTiles: 1 }, // 1.5x
    { tiles: 2, deathTiles: 1 }, // 2x
  ],

  // Hard mode: 8 rows, high risk
  // Max multiplier: ~25x (23.75x after RTP)
  HARD: [
    { tiles: 5, deathTiles: 1 }, // 1.25x
    { tiles: 5, deathTiles: 1 }, // 1.25x
    { tiles: 4, deathTiles: 1 }, // 1.33x
    { tiles: 4, deathTiles: 1 }, // 1.33x
    { tiles: 3, deathTiles: 1 }, // 1.5x
    { tiles: 3, deathTiles: 1 }, // 1.5x
    { tiles: 2, deathTiles: 1 }, // 2x
    { tiles: 2, deathTiles: 1 }, // 2x
  ],

  // Extreme mode: 10 rows, very high risk
  // Max multiplier: ~1296x (1231x after RTP)
  EXTREME: [
    { tiles: 4, deathTiles: 2 }, // 2x
    { tiles: 4, deathTiles: 2 }, // 2x
    { tiles: 3, deathTiles: 1 }, // 1.5x
    { tiles: 3, deathTiles: 1 }, // 1.5x
    { tiles: 3, deathTiles: 2 }, // 3x
    { tiles: 3, deathTiles: 2 }, // 3x
    { tiles: 2, deathTiles: 1 }, // 2x
    { tiles: 2, deathTiles: 1 }, // 2x
    { tiles: 2, deathTiles: 1 }, // 2x
    { tiles: 2, deathTiles: 1 }, // 2x
  ],
};

/**
 * Get row configurations for a game mode
 * @param mode - The game mode type
 * @returns Row configurations or null if invalid mode
 */
export function getGameMode(mode: GameModeType): RowConfig[] | null {
  return GAME_MODES[mode] ?? null;
}

/**
 * Calculate the maximum possible multiplier for a game mode (with RTP applied)
 * @param mode - The game mode type
 * @returns Maximum multiplier with RTP applied, or 0 if invalid mode
 */
export function calculateMaxMultiplier(mode: GameModeType): number {
  const rowConfigs = getGameMode(mode);
  if (!rowConfigs) return 0;

  const rawMultiplier = calculateCumulativeMultiplier(rowConfigs, rowConfigs.length);
  return applyRTP(rawMultiplier);
}

/**
 * Validate if a string is a valid game mode
 * @param mode - The mode string to validate
 * @returns True if valid game mode
 */
export function validateGameMode(mode: string): mode is GameModeType {
  return mode in GAME_MODES;
}
