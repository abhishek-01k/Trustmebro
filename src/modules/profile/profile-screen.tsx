"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserStatsCard, TransactionHistory } from "./components";
import { usePrivy } from "@privy-io/react-auth";

const ProfileScreen = () => {
  const { user } = usePrivy();

  if (!user) {
    return null;
  }

  return (
    <div className="relative flex flex-col h-full w-full bg-[#0b0a0a]/50">
      <ScrollArea className="flex-1 h-0">
        <div className="px-4 pt-4 pb-24 space-y-4">
          <UserStatsCard user={user} />

          <TransactionHistory />
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProfileScreen;
