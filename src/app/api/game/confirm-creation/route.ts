import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getContractClient } from '@/lib/contract-client';
import prisma from '@/lib/prisma';

/**
 * POST /api/game/confirm-creation
 *
 * Confirm that the game was created on-chain.
 * Called by frontend after contract.createGame() succeeds.
 *
 * Request body:
 * - sessionId: Backend session ID
 * - txHash: Transaction hash from createGame
 * - onChainGameId: Game ID from GameCreated event
 *
 * Response:
 * - sessionId: Session ID
 * - status: 'ACTIVE'
 * - currentRow: 0
 * - currentMultiplier: 1
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
    const { sessionId, txHash, onChainGameId } = body;

    if (!sessionId || !txHash || onChainGameId === undefined) {
      return apiError('INVALID_INPUT', 'sessionId, txHash, and onChainGameId are required', 400);
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

    // 5. Verify session is in correct state
    if (session.status !== 'PENDING_CHAIN') {
      return apiError(
        'GAME_NOT_ACTIVE',
        `Game session is not pending confirmation. Current status: ${session.status}`,
        400
      );
    }

    // 6. Verify transaction on-chain
    const contractClient = getContractClient();
    const txResult = await contractClient.verifyTransaction(txHash as `0x${string}`);

    if (!txResult.success) {
      // Mark session as failed
      await prisma.gameSession.update({
        where: { id: sessionId },
        data: { status: 'FAILED' },
      });

      return apiError('INVALID_INPUT', 'Transaction failed on-chain', 400);
    }

    // 7. Update session to ACTIVE
    const updatedSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: 'ACTIVE',
        onChainGameId: BigInt(onChainGameId),
        chainConfirmedAt: new Date(),
        createTxHash: txHash,
      },
    });

    // 8. Return updated session data
    return apiSuccess({
      sessionId: updatedSession.id,
      status: updatedSession.status,
      currentRow: updatedSession.currentRow,
      currentMultiplier: Number(updatedSession.currentMultiplier),
      onChainGameId: updatedSession.onChainGameId?.toString(),
    });
  } catch (error) {
    console.error('Error confirming game creation:', error);
    return apiError('INTERNAL_ERROR', 'Failed to confirm game creation', 500);
  }
}
