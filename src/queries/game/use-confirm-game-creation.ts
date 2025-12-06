import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { authenticatedFetch } from "@/lib/api-client";
import { ConfirmGameCreationPayload, ConfirmGameCreationResponse } from "@/types/game";

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

type RawConfirmGameCreationResponse =
  | ApiSuccess<ConfirmGameCreationResponse>
  | ApiError;

/**
 * React Query mutation hook for confirming on-chain game creation.
 * Wraps the `/api/game/confirm-creation` endpoint.
 */
export const useConfirmGameCreation = () => {
  const { user } = usePrivy();
  const fid = user?.farcaster?.fid;
  const queryClient = useQueryClient();

  return useMutation<
    ConfirmGameCreationResponse,
    Error,
    ConfirmGameCreationPayload
  >({
    mutationFn: async (payload: ConfirmGameCreationPayload) => {
      const response = await authenticatedFetch("/api/game/confirm-creation", fid, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const json: RawConfirmGameCreationResponse = await response.json();

      if (!response.ok || !json.success) {
        const message =
          !json.success && json.error?.message
            ? json.error.message
            : "Failed to confirm game creation";
        throw new Error(message);
      }

      return json.data;
    },
    onSuccess: () => {
      // Invalidate and immediately refetch active game query after successful confirmation
      // This ensures body-section.tsx immediately detects the new active game
      if (fid) {
        queryClient.invalidateQueries({ queryKey: ["game", "active", fid] });
        // Force immediate refetch for active queries
        queryClient.refetchQueries({ queryKey: ["game", "active", fid] });
      }
    },
  });
};


