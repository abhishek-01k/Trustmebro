import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import {
  calculateCumulativeMultiplier,
  applyRTP,
  calculatePayout,
  type GameConfig,
} from '@/lib/game-engine';
import { getContractClient } from '@/lib/contract-client';
import prisma from '@/lib/prisma';

/**
 * POST /api/game/select-tile
 *
 * Player selects a tile in the current row.
 * Returns whether the tile was safe or a death cup.
 * If death cup is hit, backend calls contract.markGameAsLost() directly.
 *
 * Request body:
 * - sessionId: Backend session ID
 * - tileIndex: Index of selected tile (0-based)
 *
 * Response (SAFE):
 * - result: 'SAFE'
 * - currentRow: number
 * - currentMultiplier: number
 * - potentialPayout: string
 * - canCashOut: boolean
 * - nextRowConfig: RowConfig (if more rows)
 * - isLastRow: boolean
 *
 * Response (DEATH):
 * - result: 'DEATH'
 * - deathTileIndex: number
 * - finalMultiplier: 0
 * - gameOver: true
 * - seed: string (revealed for verification)
 * - gameId: string (final game record ID)
 * - txHash: string (from markGameAsLost transaction)
 * - gameConfig: GameConfig (revealed for verification)
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
    const { sessionId, tileIndex } = body;

    if (!sessionId || tileIndex === undefined) {
      return apiError('INVALID_INPUT', 'sessionId and tileIndex are required', 400);
    }

    // 3. Find the session
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return apiError('SESSION_NOT_FOUND', 'Game session not found', 404);
    }

    // 4. Verify session belongs to user
    if (session.userId !== user.id) {
      return apiError('FORBIDDEN', 'You do not own this game session', 403);
    }

    // 5. Verify session is active
    if (session.status !== 'ACTIVE') {
      return apiError(
        'GAME_NOT_ACTIVE',
        `Game is not active. Current status: ${session.status}`,
        400
      );
    }

    // 6. Get game config
    const gameConfig = session.gameConfig as unknown as GameConfig;
    const currentRowIndex = session.currentRow; // 0-indexed row we're playing

    // 7. Verify game is not already complete
    if (currentRowIndex >= gameConfig.rows.length) {
      return apiError('GAME_ALREADY_OVER', 'All rows have been completed', 400);
    }

    // 8. Validate tile index
    const currentRowConfig = gameConfig.rows[currentRowIndex];
    if (tileIndex < 0 || tileIndex >= currentRowConfig.tiles) {
      return apiError(
        'INVALID_TILE_INDEX',
        `Invalid tile index. Must be between 0 and ${currentRowConfig.tiles - 1}`,
        400
      );
    }

    // 9. Check if tile is death cup
    const deathCupIndex = gameConfig.deathCupPositions[currentRowIndex];
    const isDeath = tileIndex === deathCupIndex;

    if (isDeath) {
      // Player hit death cup - backend calls contract.markGameAsLost() directly

      // Update session to MARKING_LOST
      await prisma.gameSession.update({
        where: { id: sessionId },
        data: { status: 'MARKING_LOST' },
      });

      // Call contract.markGameAsLost() with backend wallet (if on-chain game exists)
      let txHash: string | null = null;

      if (session.onChainGameId) {
        const contractClient = getContractClient();
        try {
          txHash = await contractClient.markGameAsLost(
            session.onChainGameId,
            session.seed as `0x${string}`
          );
        } catch (contractError) {
          console.error('Contract markGameAsLost failed:', contractError);
          // Still proceed - game is lost regardless of contract status
          // The game record will be created, and contract can be fixed manually if needed
        }
      }

      // Update session to COMPLETED
      await prisma.gameSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          finalizeTxHash: txHash,
        },
      });

      // Create final game record
      const game = await prisma.game.create({
        data: {
          userId: user.id,
          onChainGameId: session.onChainGameId,
          preliminaryGameId: session.preliminaryGameId,
          betAmount: session.betAmount,
          payoutAmount: '0',
          profitLoss: `-${session.betAmount}`,
          result: 'LOSS',
          finalMultiplier: 0,
          rowsCompleted: currentRowIndex,
          totalRows: gameConfig.rows.length,
          seed: session.seed,
          gameConfig: gameConfig as object,
          gameMode: session.gameMode,
          createTxHash: session.createTxHash,
          finalizeTxHash: txHash,
          completedAt: new Date(),
        },
      });

      // Link session to final game
      await prisma.gameSession.update({
        where: { id: sessionId },
        data: { finalGameId: game.id },
      });

      // Update user stats
      await prisma.user.update({
        where: { id: user.id },
        data: {
          totalGamesPlayed: { increment: 1 },
          totalWagered: { increment: session.betAmount },
          totalLost: { increment: session.betAmount },
        },
      });

      return apiSuccess({
        result: 'DEATH',
        deathTileIndex: deathCupIndex,
        finalMultiplier: 0,
        gameOver: true,
        seed: session.seed,
        gameId: game.id,
        rowsCompleted: currentRowIndex,
        totalRows: gameConfig.rows.length,
        betAmount: session.betAmount.toString(),
        txHash,
        gameConfig,
      });
    }

    // Player survived - update game state
    const newRowIndex = currentRowIndex + 1;
    const newMultiplier = calculateCumulativeMultiplier(gameConfig.rows, newRowIndex);
    const newMultiplierWithRTP = applyRTP(newMultiplier);
    const betAmount = BigInt(session.betAmount.toString());
    const potentialPayout = calculatePayout(betAmount, newMultiplierWithRTP);

    const isLastRow = newRowIndex >= gameConfig.rows.length;

    // Update session
    await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        currentRow: newRowIndex,
        currentMultiplier: newMultiplierWithRTP,
        potentialPayout: potentialPayout.toString(),
      },
    });

    // Build response
    const response: Record<string, unknown> = {
      result: 'SAFE',
      currentRow: newRowIndex,
      currentMultiplier: newMultiplierWithRTP,
      potentialPayout: potentialPayout.toString(),
      canCashOut: true,
      isLastRow,
    };

    if (!isLastRow) {
      response.nextRowConfig = gameConfig.rows[newRowIndex];
    }

    return apiSuccess(response);
  } catch (error) {
    console.error('Error selecting tile:', error);
    return apiError('INTERNAL_ERROR', 'Failed to process tile selection', 500);
  }
}
