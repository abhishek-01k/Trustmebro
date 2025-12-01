/**
 * API Client utilities for authenticated requests
 */

/**
 * Create headers with Farcaster authentication
 * @param fid - Farcaster ID
 * @param additionalHeaders - Additional headers to include
 * @returns Headers object with authentication
 */
export function createAuthHeaders(
  fid: number | null | undefined,
  additionalHeaders?: HeadersInit
): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...additionalHeaders,
  };

  if (fid) {
    (headers as Record<string, string>)["x-farcaster-fid"] = fid.toString();
  }

  return headers;
}

/**
 * Make an authenticated fetch request
 * @param url - API endpoint URL
 * @param fid - Farcaster ID
 * @param options - Fetch options
 * @returns Fetch response
 */
export async function authenticatedFetch(
  url: string,
  fid: number | null | undefined,
  options?: RequestInit
): Promise<Response> {
  if (!fid) {
    throw new Error("Authentication required: Farcaster ID not found");
  }

  return fetch(url, {
    ...options,
    headers: createAuthHeaders(fid, options?.headers),
  });
}

