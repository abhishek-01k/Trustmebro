import { useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";

export interface WaitlistShareData {
  castText: string;
  castIntent: string;
  frameUrl: string;
  miniAppUrl: string;
}

export interface WaitlistStatus {
  onWaitlist: boolean;
  position?: number;
  totalSignups: number;
  share?: WaitlistShareData;
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * React Query hook for checking waitlist status
 * @param fid - Optional Farcaster FID. If not provided, uses authenticated user's FID
 * @returns useQuery hook for waitlist status
 */
export const useWaitlistStatus = (fid?: number) => {
  const { user } = usePrivy();
  const farcasterFid = fid ?? user?.farcaster?.fid;

  return useQuery<WaitlistStatus, Error>({
    queryKey: ["waitlist", "status", farcasterFid],
    queryFn: async () => {
      if (!farcasterFid) {
        throw new Error("Farcaster FID is required");
      }

      const res = await fetch(`/api/waitlist?fid=${farcasterFid}`);

      if (!res.ok) {
        const errorData: ApiError = await res.json();
        throw new Error(errorData.error?.message || "Failed to check waitlist status");
      }

      const response = await res.json();

      return response.data;
    },
    enabled: !!farcasterFid,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

