import { usePrivy } from "@privy-io/react-auth";
import { useMutation } from "@tanstack/react-query";
import { authenticatedFetch } from "@/lib/api-client";
import { SelectTilePayload, SelectTileResponse } from "@/types/game";

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

type RawSelectTileResponse = ApiSuccess<SelectTileResponse> | ApiError;

/**
 * React Query mutation hook for selecting a tile in an active game session.
 * Wraps the `/api/game/select-tile` endpoint.
 */
export const useSelectTile = () => {
  const { user } = usePrivy();
  const fid = user?.farcaster?.fid;

  return useMutation<SelectTileResponse, Error, SelectTilePayload>({
    mutationFn: async (payload: SelectTilePayload) => {
      const response = await authenticatedFetch("/api/game/select-tile", fid, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const json: RawSelectTileResponse = await response.json();

      if (!response.ok || !json.success) {
        const message =
          !json.success && json.error?.message
            ? json.error.message
            : "Failed to select tile";
        throw new Error(message);
      }

      return json.data;
    },
  });
};

