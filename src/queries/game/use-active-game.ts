import { useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { authenticatedFetch } from "@/lib/api-client";
import { ActiveGameResponse } from "@/types/game";

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type RawActiveGameResponse = ApiSuccess<ActiveGameResponse | null> | ApiError;

/**
 * React Query hook for fetching the user's active game session.
 * Returns null if no active session exists.
 * Wraps the `/api/game/active` endpoint.
 */
export const useActiveGame = () => {
  const { user } = usePrivy();
  const fid = user?.farcaster?.fid;

  return useQuery<ActiveGameResponse | null, Error>({
    queryKey: ["game", "active", fid],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/game/active", fid);

      const json: RawActiveGameResponse = await response.json();

      if (!response.ok || !json.success) {
        const message =
          !json.success && json.error?.message
            ? json.error.message
            : "Failed to fetch active game";
        throw new Error(message);
      }

      return json.data;
    },
    enabled: !!fid,
    retry: 1,
    staleTime: 1000 * 30, // 30 seconds - active game data should be relatively fresh
    refetchInterval: 1000 * 10, // Refetch every 10 seconds to keep game state updated
  });
};

