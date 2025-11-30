import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { type GameConfig } from '@/lib/game-engine';
import prisma from '@/lib/prisma';

/**
 * GET /api/game/session/[sessionId]
 *
 * Get current game session state.
 * Does NOT reveal death cup positions until game is over.
 *
 * Response:
 * - sessionId: string
 * - status: GameSessionStatus
 * - betAmount: string
 * - gameMode: string
 * - currentRow: number
 * - currentMultiplier: number
 * - potentialPayout: string
 * - rowConfigs: RowConfig[]
 * - canCashOut: boolean
 * - onChainGameId: string | null
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // 1. Authenticate user
    const user = await getAuthUser(request);
    if (!user) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401);
    }

    // 2. Get session ID from params
    const { sessionId } = await params;

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

    // 5. Build response (don't reveal death cups unless game is over)
    const gameConfig = session.gameConfig as unknown as GameConfig;
    const isGameOver = ['COMPLETED', 'FAILED', 'EXPIRED'].includes(session.status);

    const response: Record<string, unknown> = {
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
    };

    // Reveal death cups only if game is over
    if (isGameOver) {
      response.deathCupPositions = gameConfig.deathCupPositions;
      response.seed = session.seed;
    }

    // Add current row config if game is active
    if (session.status === 'ACTIVE' && session.currentRow < gameConfig.rows.length) {
      response.currentRowConfig = gameConfig.rows[session.currentRow];
    }

    return apiSuccess(response);
  } catch (error) {
    console.error('Error getting game session:', error);
    return apiError('INTERNAL_ERROR', 'Failed to get game session', 500);
  }
}
