import prisma from './prisma';

/**
 * Authenticated user type (subset of User model)
 */
export interface AuthUser {
  id: string;
  farcasterFid: number;
  username: string;
  walletAddress: string | null;
}

/**
 * Extract Farcaster ID from request headers
 * Supports multiple auth methods:
 * - x-farcaster-fid header (from Farcaster miniapp)
 * - Authorization header with Privy token (future)
 *
 * @param request - Next.js request object
 * @returns Farcaster ID or null if not found
 */
export function extractFidFromRequest(request: Request): number | null {
  // Method 1: Direct FID header (from Farcaster miniapp context)
  const fidHeader = request.headers.get('x-farcaster-fid');
  if (fidHeader) {
    const fid = parseInt(fidHeader, 10);
    if (!isNaN(fid) && fid > 0) {
      return fid;
    }
  }

  // Method 2: Privy token (future implementation)
  // const authHeader = request.headers.get('Authorization');
  // if (authHeader?.startsWith('Bearer ')) {
  //   const token = authHeader.replace('Bearer ', '');
  //   const fid = await verifyPrivyToken(token);
  //   if (fid) return fid;
  // }

  return null;
}

/**
 * Get authenticated user from request
 * Extracts FID from headers and looks up user in database
 *
 * @param request - Next.js request object
 * @returns User object or null if not authenticated
 */
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  try {
    const fid = extractFidFromRequest(request);
    if (!fid) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { farcasterFid: fid },
      select: {
        id: true,
        farcasterFid: true,
        username: true,
        walletAddress: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
}

/**
 * Require authenticated user or throw
 * Use in API routes that require authentication
 *
 * @param request - Next.js request object
 * @returns User object
 * @throws Error if not authenticated
 */
export async function requireAuthUser(request: Request): Promise<AuthUser> {
  const user = await getAuthUser(request);
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}
