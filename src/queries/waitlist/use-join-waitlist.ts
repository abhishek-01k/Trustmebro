import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";

export interface JoinWaitlistPayload {
  farcasterFid: number;
  username: string;
  displayName?: string;
  avatar?: string;
  walletAddress?: string;
  referredBy?: string;
}

export interface JoinWaitlistResponse {
  position: number;
  totalSignups: number;
  joined: boolean;
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * React Query mutation hook for joining the waitlist
 * @returns useMutation hook for joining waitlist
 */
export const useJoinWaitlist = () => {
  const queryClient = useQueryClient();
  const { user } = usePrivy();

  return useMutation<JoinWaitlistResponse, Error, JoinWaitlistPayload>({
    mutationFn: async (payload: JoinWaitlistPayload) => {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error?.message || "Failed to join waitlist");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch waitlist status after successful join
      queryClient.invalidateQueries({ 
        queryKey: ["waitlist", "status", variables.farcasterFid] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["waitlist"] 
      });
      console.log("Successfully joined waitlist:", data);
    },
    onError: (error) => {
      console.error("Error joining waitlist:", error.message);
    },
  });
};

