import { usePrivy } from "@privy-io/react-auth";
import { useMutation } from "@tanstack/react-query";
import { authenticatedFetch } from "@/lib/api-client";
import { CreateGamePayload, CreateGameResponse } from "@/types/game";

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

type RawCreateGameResponse = ApiSuccess<CreateGameResponse> | ApiError;

/**
 * React Query mutation hook for creating a new game session
 * Wraps the `/api/game/create` endpoint.
 */
export const useCreateGame = () => {
  const { user } = usePrivy();
  const fid = user?.farcaster?.fid;

  return useMutation<CreateGameResponse, Error, CreateGamePayload>({
    mutationFn: async (payload: CreateGamePayload) => {
      const response = await authenticatedFetch("/api/game/create", fid, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const json: RawCreateGameResponse = await response.json();

      if (!response.ok || !json.success) {
        const message =
          !json.success && json.error?.message
            ? json.error.message
            : "Failed to create game";
        throw new Error(message);
      }

      return json.data;
    },
  });
};


