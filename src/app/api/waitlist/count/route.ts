import { apiSuccess, apiError } from '@/lib/api-response';
import prisma from '@/lib/prisma';

/**
 * GET /api/waitlist/count
 *
 * Get the total number of waitlist signups.
 * Used by the OG image generator to display the current total.
 *
 * Response:
 * - count: number (total waitlist signups)
 */
export async function GET() {
  try {
    const count = await prisma.waitlist.count();

    return apiSuccess({ count });
  } catch (error) {
    console.error('Error getting waitlist count:', error);
    return apiError('INTERNAL_ERROR', 'Failed to get waitlist count', 500);
  }
}
