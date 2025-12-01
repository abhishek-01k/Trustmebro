import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserRegistrationPayload } from "@/types/global";

interface RegisterUserResponse {
  user: {
    id: string;
    farcasterFid: number;
    username: string;
    displayName: string | null;
    avatar: string | null;
    walletAddress: string | null;
    totalGamesPlayed: number;
    totalWagered: string;
    totalWon: string;
    totalLost: string;
    biggestWin: string;
    biggestMultiplier: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface RegisterUserError {
  error: string;
}

/**
 * React Query mutation hook for registering a user
 * @returns useMutation hook for user registration
 */
export const useRegisterUser = () => {
  const queryClient = useQueryClient();

  return useMutation<RegisterUserResponse, Error, UserRegistrationPayload>({
    mutationFn: async (payload: UserRegistrationPayload) => {
      const response = await fetch("/api/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: RegisterUserError = await response.json();
        throw new Error(errorData.error || "Failed to register user");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch any user-related queries after successful registration
      queryClient.invalidateQueries({ queryKey: ["user"] });
      console.log("User registered successfully:", data.user);
    },
    onError: (error) => {
      console.error("Error registering user:", error.message);
    },
  });
};

