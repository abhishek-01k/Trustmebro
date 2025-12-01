"use client";

import { useCallback, useEffect, useRef } from "react";
import { sdk as miniappSdk } from "@farcaster/miniapp-sdk";
import { useLoginToMiniApp } from "@privy-io/react-auth/farcaster";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "../components/ui/button";
import LoadingScreen from "../components/loading-screen";
import {
  BodySection,
  BottomNavigation,
  HeaderSection,
} from "../components/layout";
import { useRegisterUser } from "@/queries/user";

export default function Home() {
  const { ready, authenticated, login, user } = usePrivy();
  const { initLoginToMiniApp, loginToMiniApp } = useLoginToMiniApp();
  const { mutate: registerUser } = useRegisterUser();

  const registeredUserIdRef = useRef<string | null>(null);

  const handleMiniAppLogin = useCallback(async () => {
    if (ready && !authenticated) {
      try {
        const { nonce } = await initLoginToMiniApp();
        const result = await miniappSdk.actions.signIn({ nonce });

        await loginToMiniApp({
          message: result.message,
          signature: result.signature,
        });
      } catch (error) {
        console.error("Frame login error:", error);
      }
    }
  }, [ready, authenticated, initLoginToMiniApp, loginToMiniApp]);

  useEffect(() => {
    handleMiniAppLogin();
  }, [handleMiniAppLogin]);

  useEffect(() => {
    if (user && authenticated && registeredUserIdRef.current !== user.id) {
      registeredUserIdRef.current = user.id;

      const attemptRegistration = async () => {
        try {
          if (!user.farcaster?.fid) {
            console.warn(
              "User does not have Farcaster FID, skipping registration"
            );
            return;
          }

          const registrationData = {
            farcasterFid: user.farcaster.fid,
            username: user.farcaster.username || `user_${user.farcaster.fid}`,
            avatar: user.farcaster.pfp,
            walletAddress: user.wallet?.address,
          };

          registerUser(registrationData, {
            onSuccess: () => {
              console.log("User registered successfully in backend");
            },
            onError: (error) => {
              console.error("User registration failed:", error);
              registeredUserIdRef.current = null;
            },
          });
        } catch (error) {
          console.error("User registration failed:", error);
          registeredUserIdRef.current = null;
        }
      };

      attemptRegistration();
    }
  }, [user, authenticated, registerUser]);

  useEffect(() => {
    if (!authenticated) {
      registeredUserIdRef.current = null;
    }
  }, [authenticated]);

  if (!ready) {
    return <LoadingScreen />;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={login}>Login to Mini App</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <HeaderSection />
      <BodySection />
      <BottomNavigation />
    </div>
  );
}
