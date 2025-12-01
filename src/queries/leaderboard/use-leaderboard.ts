import { useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";

export interface LeaderboardEntry {
  rank: number;
  fid: number;
  username: string;
  pfp: string | null;
  pnl: number;
}

export interface LeaderboardPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  currentUser: LeaderboardEntry | null;
  pagination: LeaderboardPagination;
}

interface ApiError {
  error: string;
}

interface UseLeaderboardOptions {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

/**
 * React Query hook for fetching leaderboard data
 * Optionally includes current user's rank if authenticated
 * @param options - Query options including pagination
 * @returns useQuery hook for leaderboard
 */
export const useLeaderboard = (options: UseLeaderboardOptions = {}) => {
  const { page = 1, limit = 20, enabled = true } = options;
  const { user } = usePrivy();
  const fid = user?.farcaster?.fid;

  return useQuery<LeaderboardResponse, Error>({
    queryKey: ["leaderboard", page, limit, fid],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Include current user's FID to get their rank
      if (fid) {
        params.append("fid", fid.toString());
      }

      const res = await fetch(`/api/leaderboard?${params.toString()}`);

      if (!res.ok) {
        const errorData: ApiError = await res.json();
        throw new Error(errorData.error || "Failed to fetch leaderboard");
      }

      return res.json();
    },
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
};

