import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { type GameConfig } from '@/lib/game-engine';
import prisma from '@/lib/prisma';

/**
 * GET /api/game/active
 *
 * Get user's active game session (if any).
 * Returns null if no active session.
 *
 * Response:
 * - data: GameSession | null
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthUser(request);
    if (!user) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401);
    }

    // 2. Find active session
    const session = await prisma.gameSession.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ['PENDING_CHAIN', 'ACTIVE', 'CASHING_OUT', 'MARKING_LOST'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!session) {
      return apiSuccess(null);
    }

    // 3. Build response (don't reveal death cups)
    const gameConfig = session.gameConfig as unknown as GameConfig;

    return apiSuccess({
      sessionId: session.id,
      status: session.status,
      betAmount: session.betAmount.toString(),
      gameMode: session.gameMode,
      currentRow: session.currentRow,
      currentMultiplier: Number(session.currentMultiplier),
      potentialPayout: session.potentialPayout.toString(),
      rowConfigs: gameConfig.rows,
      multipliers: gameConfig.multipliers,
      totalRows: gameConfig.rows.length,
      canCashOut: session.status === 'ACTIVE' && session.currentRow > 0,
      onChainGameId: session.onChainGameId?.toString() ?? null,
      preliminaryGameId: session.preliminaryGameId,
      commitmentHash: session.commitmentHash,
      currentRowConfig:
        session.status === 'ACTIVE' && session.currentRow < gameConfig.rows.length
          ? gameConfig.rows[session.currentRow]
          : null,
      createdAt: session.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error getting active game:', error);
    return apiError('INTERNAL_ERROR', 'Failed to get active game', 500);
  }
}
