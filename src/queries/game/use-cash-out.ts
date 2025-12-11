import { usePrivy } from "@privy-io/react-auth";
import { useMutation } from "@tanstack/react-query";
import { authenticatedFetch } from "@/lib/api-client";
import { CashOutPayload, CashOutResponse } from "@/types/game";

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

type RawCashOutResponse = ApiSuccess<CashOutResponse> | ApiError;

/**
 * React Query mutation hook for cashing out an active game session.
 * Wraps the `/api/game/cash-out` endpoint.
 */
export const useCashOut = () => {
  const { user } = usePrivy();
  const fid = user?.farcaster?.fid;

  return useMutation<CashOutResponse, Error, CashOutPayload>({
    mutationFn: async (payload: CashOutPayload) => {
      const response = await authenticatedFetch("/api/game/cash-out", fid, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const json: RawCashOutResponse = await response.json();

      if (!response.ok || !json.success) {
        const message =
          !json.success && json.error?.message
            ? json.error.message
            : "Failed to cash out";
        throw new Error(message);
      }

      return json.data;
    },
  });
};


