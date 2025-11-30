import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import prisma from '@/lib/prisma';

/**
 * GET /api/user/profile
 *
 * Get current user's profile and stats.
 *
 * Response:
 * - id: string
 * - fid: number
 * - walletAddress: string | null
 * - username: string | null
 * - displayName: string | null
 * - avatarUrl: string | null
 * - stats: UserStats
 * - createdAt: string
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthUser(request);
    if (!user) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401);
    }

    // 2. Get full user with stats
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!fullUser) {
      return apiError('USER_NOT_FOUND', 'User not found', 404);
    }

    // 3. Format response
    return apiSuccess({
      id: fullUser.id,
      fid: fullUser.farcasterFid,
      walletAddress: fullUser.walletAddress,
      username: fullUser.username,
      displayName: fullUser.displayName,
      avatarUrl: fullUser.avatar,
      stats: {
        totalGamesPlayed: fullUser.totalGamesPlayed,
        totalWagered: fullUser.totalWagered.toString(),
        totalWon: fullUser.totalWon.toString(),
        totalLost: fullUser.totalLost.toString(),
        netProfit: (
          BigInt(fullUser.totalWon.toString()) - BigInt(fullUser.totalLost.toString())
        ).toString(),
        biggestWin: fullUser.biggestWin.toString(),
        biggestMultiplier: Number(fullUser.biggestMultiplier),
        winRate:
          fullUser.totalGamesPlayed > 0
            ? await calculateWinRate(fullUser.id)
            : 0,
      },
      createdAt: fullUser.createdAt.toISOString(),
      updatedAt: fullUser.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return apiError('INTERNAL_ERROR', 'Failed to get user profile', 500);
  }
}

/**
 * Calculate win rate for a user
 */
async function calculateWinRate(userId: string): Promise<number> {
  const [wins, total] = await Promise.all([
    prisma.game.count({
      where: { userId, result: 'WIN' },
    }),
    prisma.game.count({
      where: { userId },
    }),
  ]);

  if (total === 0) return 0;
  return Math.round((wins / total) * 10000) / 100; // Return as percentage with 2 decimal places
}

/**
 * PATCH /api/user/profile
 *
 * Update user profile.
 * Only allows updating wallet address (if not already set) and display info.
 *
 * Request body:
 * - walletAddress?: string
 * - username?: string
 * - displayName?: string
 * - avatarUrl?: string
 *
 * Response:
 * - Updated user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthUser(request);
    if (!user) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401);
    }

    // 2. Parse request body
    const body = await request.json();
    const { walletAddress, username, displayName, avatarUrl } = body;

    // 3. Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!currentUser) {
      return apiError('USER_NOT_FOUND', 'User not found', 404);
    }

    // 4. Build update data
    const updateData: {
      walletAddress?: string;
      username?: string;
      displayName?: string;
      avatar?: string;
    } = {};

    // Only allow setting wallet address if not already set
    if (walletAddress && !currentUser.walletAddress) {
      // Validate wallet address format (basic check)
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return apiError('INVALID_INPUT', 'Invalid wallet address format', 400);
      }
      updateData.walletAddress = walletAddress.toLowerCase();
    }

    if (username !== undefined) {
      updateData.username = username;
    }

    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }

    if (avatarUrl !== undefined) {
      updateData.avatar = avatarUrl;
    }

    // 5. Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // 6. Return updated profile
    return apiSuccess({
      id: updatedUser.id,
      fid: updatedUser.farcasterFid,
      walletAddress: updatedUser.walletAddress,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      avatarUrl: updatedUser.avatar,
      stats: {
        totalGamesPlayed: updatedUser.totalGamesPlayed,
        totalWagered: updatedUser.totalWagered.toString(),
        totalWon: updatedUser.totalWon.toString(),
        totalLost: updatedUser.totalLost.toString(),
        netProfit: (
          BigInt(updatedUser.totalWon.toString()) -
          BigInt(updatedUser.totalLost.toString())
        ).toString(),
        biggestWin: updatedUser.biggestWin.toString(),
        biggestMultiplier: Number(updatedUser.biggestMultiplier),
      },
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return apiError('INTERNAL_ERROR', 'Failed to update user profile', 500);
  }
}
