import React from "react";
import { LeaderboardEntry } from "@/types/global";
import { LeaderboardItem } from "./leaderboard-item";

interface UserRankSectionProps {
  currentUser: LeaderboardEntry;
}

export const UserRankSection = ({ currentUser }: UserRankSectionProps) => {
  return (
    <div 
      className="shrink-0 px-4 pt-4 border-t border-white/5 bg-[#08070F]"
      style={{ 
        paddingBottom: `calc(1rem + max(1rem, env(safe-area-inset-bottom)) + 60px)`
      }}
    >
      <LeaderboardItem entry={currentUser} isCurrentUser={true} />
    </div>
  );
};

