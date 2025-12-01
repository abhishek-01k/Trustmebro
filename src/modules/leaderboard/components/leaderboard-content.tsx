import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaderboardEntry } from "@/types/global";
import { TopThreePodium } from "./top-three-podium";
import { LeaderboardItem } from "./leaderboard-item";

interface LeaderboardContentProps {
  topThree: LeaderboardEntry[];
  restOfLeaderboard: LeaderboardEntry[];
  isLoading: boolean;
}

export const LeaderboardContent = ({ 
  topThree, 
  restOfLeaderboard, 
  isLoading 
}: LeaderboardContentProps) => {
  return (
    <div>
      {/* Top 3 Podium Section */}
      {isLoading ? (
        <div className="relative px-0 pt-4 mb-4">
          <div className="relative rounded-2xl bg-gradient-to-b from-[#a9062c] to-[#4e1624] backdrop-blur-sm p-4 overflow-hidden min-h-[180px] border border-white/10 shadow-lg">
            <div className="flex items-end justify-center gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <Skeleton className="w-20 h-20 rounded-full bg-white/20 mb-2" />
                  <Skeleton className="h-4 w-24 bg-white/20 mb-1" />
                  <Skeleton className="h-5 w-16 bg-white/20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : topThree.length > 0 ? (
        <div className="relative px-0 pt-4 mb-4">
          <div className="relative rounded-2xl bg-gradient-to-b from-[#a9062c] to-[#4e1624] backdrop-blur-sm p-4 overflow-hidden border border-white/10 shadow-lg">
            {/* Background pattern */}
            <div className="absolute opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            </div>
            
            {/* Top 3 Users - Order: 2nd (left), 1st (center), 3rd (right) */}
            <div className="relative flex items-end justify-center gap-4">
              {topThree
                .sort((a, b) => {
                  // Order: rank 2, rank 1, rank 3
                  const order: Record<number, number> = { 2: 0, 1: 1, 3: 2 };
                  return (order[a.rank] ?? 999) - (order[b.rank] ?? 999);
                })
                .map((entry) => (
                  <div key={entry.rank} className="relative flex-1 flex flex-col items-center">
                    <TopThreePodium entry={entry} position={entry.rank as 1 | 2 | 3} />
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Leaderboard list (ranks 4+) */}
      <div className="px-0 py-2">
        {isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0b0a0a]/50 px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 bg-white/10 mb-2" />
                    <Skeleton className="h-3 w-24 bg-white/10" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20 bg-white/10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {restOfLeaderboard.map((entry) => (
              <LeaderboardItem key={entry.rank} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

