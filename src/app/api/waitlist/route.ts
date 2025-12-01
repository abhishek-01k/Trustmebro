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

    // Generate cast text for sharing (minimal - let the card speak)
    const castText = `Position #${position} locked 🔴`;

    // Base URL for OG images and share pages (Vercel domain)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://trustmebro-tan.vercel.app';
    // App URL for miniapp link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster.xyz/miniapps/vjnwKcePmS0G/trust-me-bro';

    // Frame URL with user's position for dynamic OG image (must be on Vercel domain)
    const frameUrl = `${baseUrl}/waitlist/share?pos=${position}&total=${totalSignups}&fid=${farcasterFid}`;

    // Cast intent with frame embed (shows preview card, text is minimal)
    const castIntent = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(frameUrl)}`;

    return apiSuccess({
      position,
      totalSignups,
      joined: true,
      share: {
        castText,
        castIntent,
        frameUrl,
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

    // Generate share data (minimal - let the card speak)
    const castText = `Position #${position} locked 🔴`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://trustmebro-tan.vercel.app';
    const frameUrl = `${baseUrl}/waitlist/share?pos=${position}&total=${totalSignups}&fid=${farcasterFid}`;
    const castIntent = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(frameUrl)}`;

    return apiSuccess({
      onWaitlist: true,
      position,
      totalSignups,
      share: {
        castText,
        castIntent,
        frameUrl,
      },
    });
  } catch (error) {
    console.error('Error checking waitlist:', error);
    return apiError('INTERNAL_ERROR', 'Failed to check waitlist status', 500);
  }
}
