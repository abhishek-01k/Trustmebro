"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Context, sdk } from "@farcaster/miniapp-sdk";

const MiniAppContext = createContext<Context.MiniAppContext | null>(null);

const MiniAppProvider = ({ children }: { children: React.ReactNode }) => {
  const [context, setContext] = useState<Context.MiniAppContext | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const contextData = await sdk.context;
        setContext(contextData);
        sdk.actions.ready();
        await sdk.actions.addMiniApp();
      } catch (error) {
        console.error("Error initializing Farcaster SDK:", error);
      }
    };

    init();
  }, []);

  return (
    <MiniAppContext.Provider value={context}>
      {children}
    </MiniAppContext.Provider>
  );
};

// Safe hook that returns null if context not ready (for registration hook)
const useMiniAppContext = () => {
  return useContext(MiniAppContext);
};

// Original hook that throws if context not ready (for components that require it)
const useMiniApp = () => {
  const context = useContext(MiniAppContext);
  if (!context) {
    throw new Error("useMiniApp must be used within MiniAppProvider");
  }
  return context;
};

export { MiniAppProvider, useMiniApp, useMiniAppContext };
