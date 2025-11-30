"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useMiniAppContext } from "@/src/context/mini-app-context";
import { UserRegistrationPayload } from "@/src/types/global";

interface UseUserRegistrationResult {
  isRegistered: boolean;
  isRegistering: boolean;
  error: string | null;
  registerUser: () => Promise<void>;
  user: UserRegistrationPayload | null;
}

export function useUserRegistration(): UseUserRegistrationResult {
  const { authenticated, user: privyUser } = usePrivy();
  const miniAppContext = useMiniAppContext();

  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserRegistrationPayload | null>(null);

  // Extract user data from Farcaster context and Privy
  const getUserData = useCallback((): UserRegistrationPayload | null => {
    if (!miniAppContext?.user) {
      return null;
    }

    const farcasterUser = miniAppContext.user;

    // Get wallet address from Privy if available
    const walletAddress = privyUser?.wallet?.address || undefined;

    return {
      farcasterFid: farcasterUser.fid,
      username: farcasterUser.username || `user_${farcasterUser.fid}`,
      avatar: farcasterUser.pfpUrl || undefined,
      walletAddress,
    };
  }, [miniAppContext, privyUser]);

  // Register user with backend (handles duplicates via upsert)
  const registerUser = useCallback(async () => {
    const userData = getUserData();

    if (!userData) {
      setError("User data not available");
      return;
    }

    setIsRegistering(true);
    setError(null);

    try {
      const response = await fetch("/api/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to register user");
      }

      setUser(userData);
      setIsRegistered(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      console.error("User registration error:", err);
    } finally {
      setIsRegistering(false);
    }
  }, [getUserData]);

  // Auto-register when authenticated and context is available
  useEffect(() => {
    if (authenticated && miniAppContext?.user && !isRegistered && !isRegistering) {
      registerUser();
    }
  }, [authenticated, miniAppContext, isRegistered, isRegistering, registerUser]);

  // Update user data when context changes
  useEffect(() => {
    const userData = getUserData();
    if (userData && isRegistered) {
      setUser(userData);
    }
  }, [getUserData, isRegistered]);

  return {
    isRegistered,
    isRegistering,
    error,
    registerUser,
    user,
  };
}
