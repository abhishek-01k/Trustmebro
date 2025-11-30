"use client";

import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { LeaderboardEntry } from "@/src/types/global";
import { LeaderboardContent } from "./components/leaderboard-content";
import { UserRankSection } from "./components/user-rank-section";

// Generate random avatar URLs (using placeholder service)
const getAvatarUrl = (seed: string) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

// Dummy data
const generateDummyData = (): LeaderboardEntry[] => {
  const usernames = [
    "Sophie Reynolds",
    "Finn Carter",
    "Iris Green",
    "Ava Elizabeth Turner",
    "Leo Harrison",
    "Rowan Elijah",
    "Mia Sophia Bennett",
    "William Turner",
    "Ruby Claire",
    "Silas Gabriel Ford",
    "CryptoKing",
    "MoonWalker",
    "DiamondHands",
    "WhaleHunter",
    "BullRunner",
    "HodlMaster",
    "TradeGuru",
    "ProfitSeeker",
    "LuckyTrader",
    "MarketMaker",
  ];

  return usernames.map((username, index) => ({
    rank: index + 1,
    username,
    profit: Math.floor(Math.random() * 100) + 500,
    avatar: getAvatarUrl(username),
    userId: `100${60000 + index}`,
  }));
};

// Current user data (dummy)
const currentUser: LeaderboardEntry = {
  rank: 42,
  username: "You",
  profit: 125,
  avatar: getAvatarUrl("You"),
  userId: "10066542",
};

const LeaderboardSection = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      const data = generateDummyData().sort((a, b) => b.profit - a.profit);
      // Reassign ranks after sorting
      const rankedData = data.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
      setLeaderboardData(rankedData);
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const topThree = leaderboardData.slice(0, 3);
  const restOfLeaderboard = leaderboardData.slice(3);

  return (
    <div className="relative flex flex-col h-full w-full bg-[#08070F]">
      <div className="shrink-0 px-4 pt-6 pb-4 z-10 bg-[#08070F]">
        <h2 className="text-2xl font-bold text-white mb-1">Leaderboard</h2>
        <p className="text-sm text-white/60">Top traders this week</p>
      </div>

      <ScrollArea className="flex-1 h-0">
        <LeaderboardContent 
          topThree={topThree} 
          restOfLeaderboard={restOfLeaderboard} 
          isLoading={isLoading} 
        />
      </ScrollArea>

      {!isLoading && <UserRankSection currentUser={currentUser} />}
    </div>
  );
};

export default LeaderboardSection;
