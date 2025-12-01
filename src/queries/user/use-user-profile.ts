import { useQuery } from "@tanstack/react-query";
import { authenticatedFetch } from "@/lib/api-client";
import { usePrivy } from "@privy-io/react-auth";

export interface UserStats {
  totalGamesPlayed: number;
  totalWagered: string;
  totalWon: string;
  totalLost: string;
  netProfit: string;
  biggestWin: string;
  biggestMultiplier: number;
  winRate?: number;
}

export interface UserProfile {
  id: string;
  fid: number;
  walletAddress: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  stats: UserStats;
  createdAt: string;
  updatedAt: string;
}

interface ApiError {
  error: string;
  code: string;
}

/**
 * React Query hook for fetching the current user's profile
 * Requires Farcaster authentication via Privy
 * @returns useQuery hook for user profile
 */
export const useUserProfile = () => {
  const {user} = usePrivy();
  const fid = user?.farcaster?.fid;

  return useQuery<UserProfile, Error>({
    queryKey: ["user", "profile", fid],
    queryFn: async () => {
      const res = await authenticatedFetch("/api/user/profile", fid);

      if (!res.ok) {
        const errorData: ApiError = await res.json();
        throw new Error(errorData.error || "Failed to fetch user profile");
      }

      const response = await res.json();

      return response.data;
    },
    enabled: !!fid,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });
};

