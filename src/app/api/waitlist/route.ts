import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import prisma from '@/lib/prisma';

/**
 * POST /api/waitlist
 *
 * Join the waitlist for early access.
 *
 * Request body:
 * - farcasterFid: number (required)
 * - username: string (required)
 * - displayName?: string
 * - avatar?: string
 * - walletAddress?: string
 * - referredBy?: string (FID of referrer)
 *
 * Response:
 * - position: number (waitlist position)
 * - totalSignups: number
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { farcasterFid, username, displayName, avatar, walletAddress, referredBy } = body;

    if (!farcasterFid || !username) {
      return apiError('INVALID_INPUT', 'farcasterFid and username are required', 400);
    }

    // Upsert to handle duplicate signups
    const entry = await prisma.waitlist.upsert({
      where: { farcasterFid },
      update: {
        username,
        displayName,
        avatar,
        walletAddress,
      },
      create: {
        farcasterFid,
        username,
        displayName,
        avatar,
        walletAddress,
        referredBy,
      },
    });

    // Get position (count of entries before this one)
    const position = await prisma.waitlist.count({
      where: {
        createdAt: { lte: entry.createdAt },
      },
    });

    const totalSignups = await prisma.waitlist.count();

    // URLs for sharing
    const sharePageUrl = `https://trustmebro-tan.vercel.app/waitlist/share?pos=${position}`;
    const miniAppUrl = 'https://farcaster.xyz/miniapps/vjnwKcePmS0G/trust-me-bro';

    // Generate engaging cast text with mini app URL inline
    const castText = `🔴 Just minted my Early Access Pass for TrustMeBro!\n\nPosition #${position} of ${totalSignups} degens.\n\nMint yours now 👇\n${miniAppUrl}`;

    // Cast intent with share page embed (has OG meta tags for preview)
    const castIntent = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(sharePageUrl)}`;

    return apiSuccess({
      position,
      totalSignups,
      joined: true,
      share: {
        castText,
        castIntent,
        sharePageUrl,
        miniAppUrl,
      },
    });
  } catch (error) {
    console.error('Error joining waitlist:', error);
    return apiError('INTERNAL_ERROR', 'Failed to join waitlist', 500);
  }
}

/**
 * GET /api/waitlist
 *
 * Check waitlist status for a user.
 *
 * Query params:
 * - fid: number (Farcaster FID)
 *
 * Response:
 * - onWaitlist: boolean
 * - position?: number
 * - totalSignups: number
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');

    if (!fid) {
      return apiError('INVALID_INPUT', 'fid query parameter is required', 400);
    }

    const farcasterFid = parseInt(fid, 10);
    if (isNaN(farcasterFid)) {
      return apiError('INVALID_INPUT', 'fid must be a number', 400);
    }

    const entry = await prisma.waitlist.findUnique({
      where: { farcasterFid },
    });

    const totalSignups = await prisma.waitlist.count();

    if (!entry) {
      return apiSuccess({
        onWaitlist: false,
        totalSignups,
      });
    }

    // Get position
    const position = await prisma.waitlist.count({
      where: {
        createdAt: { lte: entry.createdAt },
      },
    });

    // Generate engaging share data
    const sharePageUrl = `https://trustmebro-tan.vercel.app/waitlist/share?pos=${position}`;
    const miniAppUrl = 'https://farcaster.xyz/miniapps/vjnwKcePmS0G/trust-me-bro';
    const castText = `🔴 Just minted my Early Access Pass for TrustMeBro!\n\nPosition #${position} of ${totalSignups} degens.\n\nMint yours now 👇\n${miniAppUrl}`;
    const castIntent = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(sharePageUrl)}`;

    return apiSuccess({
      onWaitlist: true,
      position,
      totalSignups,
      share: {
        castText,
        castIntent,
        sharePageUrl,
        miniAppUrl,
      },
    });
  } catch (error) {
    console.error('Error checking waitlist:', error);
    return apiError('INTERNAL_ERROR', 'Failed to check waitlist status', 500);
  }
}
