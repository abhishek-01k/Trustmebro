import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getContractClient, OnChainGameStatus } from '@/lib/contract-client';

/**
 * GET /api/contract/game/[gameId]
 *
 * Get on-chain game data directly from the contract.
 * Public endpoint - no authentication required.
 *
 * Path params:
 * - gameId: On-chain game ID (bigint as string)
 *
 * Response:
 * - gameId: string
 * - player: string (address)
 * - betAmount: string (in wei)
 * - commitmentHash: string
 * - status: string ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED')
 * - preliminaryGameId: string
 * - createdAt: string (timestamp)
 * - seed: string (if revealed)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    // 1. Get game ID from params
    const { gameId } = await params;

    // 2. Validate game ID
    let gameIdBigInt: bigint;
    try {
      gameIdBigInt = BigInt(gameId);
    } catch {
      return apiError('INVALID_INPUT', 'Invalid game ID format', 400);
    }

    // 3. Get game from contract
    const contractClient = getContractClient();
    let game;

    try {
      game = await contractClient.getGame(gameIdBigInt);
    } catch (contractError) {
      console.error('Error fetching game from contract:', contractError);
      return apiError('CONTRACT_ERROR', 'Failed to fetch game from contract', 500);
    }

    // 4. Check if game exists (player address will be zero if not)
    if (game.player === '0x0000000000000000000000000000000000000000') {
      return apiError('GAME_NOT_FOUND', 'Game not found on-chain', 404);
    }

    // 5. Map status to readable string
    const statusMap: Record<number, string> = {
      [OnChainGameStatus.CREATED]: 'CREATED',
      [OnChainGameStatus.CASHED_OUT]: 'CASHED_OUT',
      [OnChainGameStatus.LOST]: 'LOST',
    };

    // 6. Return game data
    return apiSuccess({
      gameId: gameId,
      player: game.player,
      betAmount: game.betAmount.toString(),
      commitmentHash: game.commitmentHash,
      status: statusMap[game.status] ?? 'UNKNOWN',
      statusCode: game.status,
      preliminaryGameId: game.preliminaryGameId,
      createdAt: game.createdAt.toString(),
      createdAtDate: new Date(Number(game.createdAt) * 1000).toISOString(),
      seed: game.seed !== '0x0000000000000000000000000000000000000000000000000000000000000000'
        ? game.seed
        : null, // Only return seed if revealed
    });
  } catch (error) {
    console.error('Error getting on-chain game:', error);
    return apiError('INTERNAL_ERROR', 'Failed to get on-chain game', 500);
  }
}
