"use client";

import { useCallback, useEffect } from "react";
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

export default function Home() {
  const { ready, authenticated, login } = usePrivy();
  const { initLoginToMiniApp, loginToMiniApp } = useLoginToMiniApp();

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
      {/* <HeaderSection /> */}
      <BodySection />
      {/* <BottomNavigation /> */}
    </div>
  );
}
