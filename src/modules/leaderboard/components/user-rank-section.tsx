import React from "react";
import { LeaderboardEntry } from "@/types/global";
import { LeaderboardItem } from "./leaderboard-item";

interface UserRankSectionProps {
  currentUser: LeaderboardEntry;
}

export const UserRankSection = ({ currentUser }: UserRankSectionProps) => {
  return (
    <div 
      className="shrink-0 px-0 pt-4 border-t border-white/10 backdrop-blur-sm pb-4"
    >
      <LeaderboardItem entry={currentUser} isCurrentUser={true} />
    </div>
  );
};

