import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import prisma from '@/lib/prisma';

interface GameHistoryItem {
  id: string;
  onChainGameId: bigint | null;
  preliminaryGameId: string | null;
  betAmount: { toString(): string };
  payoutAmount: { toString(): string };
  profitLoss: { toString(): string };
  result: string;
  finalMultiplier: { toString(): string };
  rowsCompleted: number;
  totalRows: number;
  gameMode: string;
  completedAt: Date | null;
  createTxHash: string | null;
  finalizeTxHash: string | null;
}

/**
 * GET /api/game/history
 *
 * Get user's game history (completed games).
 *
 * Query params:
 * - limit: number (default: 20, max: 100)
 * - offset: number (default: 0)
 * - result: 'WIN' | 'LOSS' | 'all' (default: 'all')
 *
 * Response:
 * - games: Game[]
 * - total: number
 * - limit: number
 * - offset: number
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthUser(request);
    if (!user) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401);
    }

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const resultFilter = searchParams.get('result');

    const limit = Math.min(Math.max(parseInt(limitParam ?? '20', 10) || 20, 1), 100);
    const offset = Math.max(parseInt(offsetParam ?? '0', 10) || 0, 0);

    // 3. Build where clause
    const where: { userId: string; result?: 'WIN' | 'LOSS' } = {
      userId: user.id,
    };

    if (resultFilter && resultFilter !== 'all') {
      if (resultFilter === 'WIN' || resultFilter === 'LOSS') {
        where.result = resultFilter;
      }
    }

    // 4. Get games and total count
    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where,
        orderBy: { completedAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          onChainGameId: true,
          preliminaryGameId: true,
          betAmount: true,
          payoutAmount: true,
          profitLoss: true,
          result: true,
          finalMultiplier: true,
          rowsCompleted: true,
          totalRows: true,
          gameMode: true,
          completedAt: true,
          createTxHash: true,
          finalizeTxHash: true,
        },
      }),
      prisma.game.count({ where }),
    ]);

    // 5. Format response
    const formattedGames = (games as GameHistoryItem[]).map((game: GameHistoryItem) => ({
      id: game.id,
      onChainGameId: game.onChainGameId?.toString() ?? null,
      preliminaryGameId: game.preliminaryGameId,
      betAmount: game.betAmount.toString(),
      payoutAmount: game.payoutAmount.toString(),
      profitLoss: game.profitLoss.toString(),
      result: game.result,
      finalMultiplier: Number(game.finalMultiplier),
      rowsCompleted: game.rowsCompleted,
      totalRows: game.totalRows,
      gameMode: game.gameMode,
      completedAt: game.completedAt?.toISOString() ?? null,
      createTxHash: game.createTxHash,
      finalizeTxHash: game.finalizeTxHash,
    }));

    return apiSuccess({
      games: formattedGames,
      total,
      limit,
      offset,
      hasMore: offset + games.length < total,
    });
  } catch (error) {
    console.error('Error getting game history:', error);
    return apiError('INTERNAL_ERROR', 'Failed to get game history', 500);
  }
}
