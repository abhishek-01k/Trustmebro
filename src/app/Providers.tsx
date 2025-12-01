"use client";

import React, { useState } from "react";
import { PrivyProvider as ReactPrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MiniAppProvider } from "../context/mini-app-context";
import { GlobalContextProvider } from "../context/global-context";
import { WagmiProvider } from "@privy-io/wagmi";
import { wagmiConfig } from "../config/wagmi-config";

const Providers = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ReactPrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
        clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
      >
        <WagmiProvider config={wagmiConfig}>
        <MiniAppProvider>
          <GlobalContextProvider>{children}</GlobalContextProvider>
        </MiniAppProvider>
        </WagmiProvider>
      </ReactPrivyProvider>
    </QueryClientProvider>
  );
};

export default Providers;
