import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { type GameConfig } from '@/lib/game-engine';
import { getContractClient } from '@/lib/contract-client';
import prisma from '@/lib/prisma';

/**
 * POST /api/game/cash-out
 *
 * Player requests to cash out current winnings.
 * Backend calls the contract's cashOut() function directly (requires backend wallet).
 *
 * Flow:
 * 1. Frontend calls this endpoint
 * 2. Backend validates session and calculates payout
 * 3. Backend calls contract.cashOut(gameId, payoutAmount, seed) with backend wallet
 * 4. Backend creates final game record and returns result
 *
 * Request body:
 * - sessionId: Backend session ID
 *
 * Response:
 * - sessionId: Session ID
 * - gameId: Final game record ID
 * - status: 'COMPLETED'
 * - result: 'WIN'
 * - payoutAmount: string (before house edge)
 * - playerReceives: string (after 5% house edge)
 * - profitLoss: string
 * - finalMultiplier: number
 * - rowsCompleted: number
 * - txHash: string
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
    const { sessionId } = body;

    if (!sessionId) {
      return apiError('INVALID_INPUT', 'sessionId is required', 400);
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

    // 6. Verify player has completed at least one row
    if (session.currentRow === 0) {
      return apiError(
        'CANNOT_CASH_OUT',
        'You must complete at least one row before cashing out',
        400
      );
    }

    // 7. Verify on-chain game exists
    if (!session.onChainGameId) {
      return apiError(
        'GAME_NOT_ACTIVE',
        'Game has not been confirmed on-chain yet',
        400
      );
    }

    // 8. Calculate payout amounts
    const payoutAmount = BigInt(session.potentialPayout.toString());

    // House edge is 5%, deducted by contract
    // Player receives: payoutAmount * 95%
    const playerReceives = (payoutAmount * 95n) / 100n;

    // 9. Update session status to CASHING_OUT (in case of failure, we can retry)
    await prisma.gameSession.update({
      where: { id: sessionId },
      data: { status: 'CASHING_OUT' },
    });

    // 10. Call contract.cashOut() with backend wallet
    const contractClient = getContractClient();
    let txHash: string;

    try {
      txHash = await contractClient.cashOut(
        session.onChainGameId,
        payoutAmount,
        session.seed as `0x${string}`
      );
    } catch (contractError) {
      console.error('Contract cashOut failed:', contractError);
      // Revert status to ACTIVE so user can retry
      await prisma.gameSession.update({
        where: { id: sessionId },
        data: { status: 'ACTIVE' },
      });
      return apiError('CONTRACT_ERROR', 'Failed to process cash out on chain', 500);
    }

    // 11. Update session to completed
    await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        finalizeTxHash: txHash,
      },
    });

    // 12. Get game config and calculate final values
    const gameConfig = session.gameConfig as unknown as GameConfig;
    const currentMultiplier = Number(session.currentMultiplier);
    const betAmount = BigInt(session.betAmount.toString());
    const profitLoss = playerReceives - betAmount;

    // 13. Create final game record
    const game = await prisma.game.create({
      data: {
        userId: user.id,
        onChainGameId: session.onChainGameId,
        preliminaryGameId: session.preliminaryGameId,
        betAmount: session.betAmount,
        payoutAmount: playerReceives.toString(),
        profitLoss: profitLoss.toString(),
        result: 'WIN',
        finalMultiplier: session.currentMultiplier,
        rowsCompleted: session.currentRow,
        totalRows: gameConfig.rows.length,
        seed: session.seed,
        gameConfig: gameConfig as object,
        gameMode: session.gameMode,
        createTxHash: session.createTxHash,
        finalizeTxHash: txHash,
        completedAt: new Date(),
      },
    });

    // 14. Link session to final game
    await prisma.gameSession.update({
      where: { id: sessionId },
      data: { finalGameId: game.id },
    });

    // 15. Update user stats
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { biggestWin: true, biggestMultiplier: true },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalGamesPlayed: { increment: 1 },
        totalWagered: { increment: session.betAmount },
        totalWon: { increment: playerReceives.toString() },
        // Update biggest win if this is larger
        ...(currentUser && profitLoss > 0n && playerReceives > BigInt(currentUser.biggestWin?.toString() ?? '0')
          ? { biggestWin: playerReceives.toString() }
          : {}),
        // Update biggest multiplier if this is larger
        ...(currentUser && currentMultiplier > Number(currentUser.biggestMultiplier ?? 0)
          ? { biggestMultiplier: currentMultiplier }
          : {}),
      },
    });

    // 16. Return success response
    return apiSuccess({
      sessionId: session.id,
      gameId: game.id,
      status: 'COMPLETED',
      result: 'WIN',
      payoutAmount: payoutAmount.toString(),
      playerReceives: playerReceives.toString(),
      profitLoss: profitLoss.toString(),
      finalMultiplier: currentMultiplier,
      rowsCompleted: session.currentRow,
      totalRows: gameConfig.rows.length,
      betAmount: session.betAmount.toString(),
      txHash,
      seed: session.seed,
      gameConfig,
    });
  } catch (error) {
    console.error('Error processing cash out:', error);
    return apiError('INTERNAL_ERROR', 'Failed to process cash out', 500);
  }
}
