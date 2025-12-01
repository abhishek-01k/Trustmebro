"use client";

import React, { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LeaderboardEntry } from "@/types/global";
import { LeaderboardContent } from "./components/leaderboard-content";
import { UserRankSection } from "./components/user-rank-section";
import { LeaderboardResponse } from "@/queries/leaderboard/use-leaderboard";

interface LeaderboardScreenProps {
  leaderboardData: LeaderboardResponse | undefined;
  isLoading: boolean;
  error: Error | null;
}

const LeaderboardSection = ({ 
  leaderboardData, 
  isLoading, 
  error 
}: LeaderboardScreenProps) => {
  // Transform API data to component format
  const transformedData = useMemo((): LeaderboardEntry[] => {
    if (!leaderboardData?.leaderboard) return [];
    
    return leaderboardData.leaderboard.map((entry) => ({
      rank: entry.rank,
      username: entry.username,
      profit: entry.pnl,
      avatar: entry.pfp || undefined,
      userId: entry.fid.toString(),
    }));
  }, [leaderboardData]);

  // Transform current user data
  const currentUser = useMemo((): LeaderboardEntry | null => {
    if (!leaderboardData?.currentUser) return null;
    
    const user = leaderboardData.currentUser;
    return {
      rank: user.rank,
      username: user.username,
      profit: user.pnl,
      avatar: user.pfp || undefined,
      userId: user.fid.toString(),
    };
  }, [leaderboardData]);

  const topThree = transformedData.slice(0, 3);
  const restOfLeaderboard = transformedData.slice(3);

  return (
    <div 
      className="relative flex flex-col h-full w-full min-h-screen p-4 pb-32"
      style={{
        backgroundImage: 'url(/background_image.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <ScrollArea className="flex-1 h-0">
        {error ? (
          <div className="px-4 py-8 text-center">
            <p className="text-red-400 text-sm">Failed to load leaderboard</p>
            <p className="text-white/50 text-xs mt-1">{error.message}</p>
          </div>
        ) : (
          <LeaderboardContent 
            topThree={topThree} 
            restOfLeaderboard={restOfLeaderboard} 
            isLoading={isLoading} 
          />
        )}
      </ScrollArea>

      {!isLoading && currentUser && <UserRankSection currentUser={currentUser} />}
    </div>
  );
};

export default LeaderboardSection;
