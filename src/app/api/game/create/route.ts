import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import {
  generateGameSeed,
  createGameConfig,
  createCommitmentHash,
  calculatePayout,
  applyRTP,
  calculateCumulativeMultiplier,
} from '@/lib/game-engine';
import { GAME_MODES, validateGameMode, type GameModeType } from '@/lib/game-modes';
import { getContractClient, generatePreliminaryGameId } from '@/lib/contract-client';
import prisma from '@/lib/prisma';

/**
 * POST /api/game/create
 *
 * Initialize a new game session with seed, death cups, and commitment hash.
 * Returns data needed for frontend to call contract.createGame()
 *
 * Request body:
 * - betAmount: string (token amount in wei)
 * - gameMode: 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME' (default: 'MEDIUM')
 *
 * Response:
 * - sessionId: Backend session ID
 * - preliminaryGameId: bytes32 hex for contract
 * - commitmentHash: bytes32 hex for contract
 * - betAmount: string
 * - rowConfigs: Array of row configurations
 * - estimatedMultipliers: Per-row multipliers
 * - maxMultiplier: Max possible multiplier (with RTP)
 * - contractAddress: Address to call createGame on
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthUser(request);
    if (!user) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401);
    }

    // 2. Parse request body
    const body = await request.json();
    const { betAmount, gameMode = 'MEDIUM' } = body;

    // 3. Validate game mode
    if (!validateGameMode(gameMode)) {
      return apiError('INVALID_GAME_MODE', `Invalid game mode: ${gameMode}. Valid modes: EASY, MEDIUM, HARD, EXTREME`, 400);
    }

    // 4. Validate bet amount
    let betAmountBigInt: bigint;
    try {
      betAmountBigInt = BigInt(betAmount);
      if (betAmountBigInt <= 0n) {
        return apiError('INVALID_BET_AMOUNT', 'Bet amount must be greater than 0', 400);
      }
    } catch {
      return apiError('INVALID_BET_AMOUNT', 'Invalid bet amount format', 400);
    }

    // 5. Check for existing active game session
    const existingSession = await prisma.gameSession.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ['PENDING_CHAIN', 'ACTIVE', 'CASHING_OUT', 'MARKING_LOST'],
        },
      },
    });

    if (existingSession) {
      return apiError(
        'GAME_NOT_ACTIVE',
        'You already have an active game session. Please complete or cancel it first.',
        400
      );
    }

    // 6. Get contract state to validate bet against limits
    const contractClient = getContractClient();
    const contractState = await contractClient.getContractState();

    // 7. Check if contract is paused
    if (contractState.isPaused) {
      return apiError('CONTRACT_PAUSED', 'Game contract is currently paused', 503);
    }

    // 8. Check bet against max bet limit
    if (betAmountBigInt > contractState.maxBet) {
      return apiError(
        'INVALID_BET_AMOUNT',
        `Bet amount exceeds maximum allowed (${contractState.maxBet.toString()} wei)`,
        400
      );
    }

    // 9. Get row configurations for game mode
    const rowConfigs = GAME_MODES[gameMode as GameModeType];

    // 10. Generate game seed and configuration
    const seed = generateGameSeed();
    const gameConfig = createGameConfig(seed, rowConfigs);

    // 11. Calculate max possible payout (for commitment)
    const maxMultiplier = calculateCumulativeMultiplier(rowConfigs, rowConfigs.length);
    const maxMultiplierWithRTP = applyRTP(maxMultiplier);
    const maxPayout = calculatePayout(betAmountBigInt, maxMultiplierWithRTP);

    // 12. Check max payout against contract limit
    if (maxPayout > contractState.maxPayout) {
      return apiError(
        'INVALID_BET_AMOUNT',
        `Potential payout exceeds maximum allowed. Please reduce bet amount.`,
        400
      );
    }

    // 13. Create commitment hash
    const commitmentHash = createCommitmentHash(seed, maxPayout);

    // 14. Generate preliminary game ID
    const preliminaryGameId = generatePreliminaryGameId();

    // 15. Create game session in database
    const session = await prisma.gameSession.create({
      data: {
        userId: user.id,
        preliminaryGameId,
        betAmount: betAmount.toString(),
        seed,
        commitmentHash,
        gameConfig: gameConfig as object,
        gameMode,
        status: 'PENDING_CHAIN',
        currentRow: 0,
        currentMultiplier: 1,
        potentialPayout: '0',
      },
    });

    // 16. Return data for frontend to call contract
    return apiSuccess({
      sessionId: session.id,
      preliminaryGameId,
      commitmentHash,
      betAmount: betAmount.toString(),
      rowConfigs,
      estimatedMultipliers: gameConfig.multipliers,
      maxMultiplier: maxMultiplierWithRTP,
      maxPayout: maxPayout.toString(),
      contractAddress: contractClient.contractAddress,
    });
  } catch (error) {
    console.error('Error creating game:', error);
    return apiError('INTERNAL_ERROR', 'Failed to create game session', 500);
  }
}
