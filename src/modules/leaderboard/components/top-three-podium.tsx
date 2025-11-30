import React from "react";
import { Crown, Coins } from "lucide-react";
import { LeaderboardEntry } from "@/src/types/global";
import { formatScore, truncateToChars } from "@/src/lib/utils";

interface TopThreePodiumProps {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
}

const CrownIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) {
    return <Crown className="w-8 h-8 text-yellow-400" fill="currentColor" />;
  }
  if (rank === 2) {
    return <Crown className="w-7 h-7 text-gray-300" fill="currentColor" />;
  }
  return <Crown className="w-7 h-7 text-amber-600" fill="currentColor" />;
};

export const TopThreePodium = ({ entry, position }: TopThreePodiumProps) => {
  const positions = {
    1: "order-2", // Center
    2: "order-1", // Left
    3: "order-3", // Right
  };

  const sizes = {
    1: "w-24 h-24", // Largest for rank 1
    2: "w-18 h-18",
    3: "w-14 h-14",
  };

  // Height adjustments for podium effect - rank 1 tallest, rank 2 medium, rank 3 shortest
  const heightStyles = {
    1: "mt-0", // No margin for rank 1 (tallest)
    2: "mt-0", // Add top margin for rank 2 (medium)
    3: "mt-0", // More top margin for rank 3 (shortest)
  };

  return (
    <div className={`relative flex flex-col items-center ${positions[position]} ${heightStyles[position]}`}>
      {/* Rank Number (large, semi-transparent background) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
        <span className={`text-8xl font-bold opacity-10 ${
          position === 1 ? "text-yellow-400" : position === 2 ? "text-gray-300" : "text-amber-600"
        }`}>
          {position}
        </span>
      </div>

      {/* Crown */}
      <div className="mb-2 relative z-10">
        <CrownIcon rank={position} />
      </div>
      
      {/* Profile Picture */}
      <div className={`relative z-10 ${sizes[position]} rounded-full border-2 overflow-hidden mb-2 ${
        position === 1 ? "border-yellow-400/50" : position === 2 ? "border-gray-300/50" : "border-amber-600/50"
      }`}>
        {entry.avatar ? (
          <img src={entry.avatar} alt={entry.username} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#1A1630] flex items-center justify-center text-white font-semibold">
            {entry.username.charAt(0)}
          </div>
        )}
      </div>

      {/* Name */}
      <p className="text-white font-semibold text-sm text-center mb-1 px-2 relative z-10 break-words">
        {truncateToChars(entry.username, 8)}
      </p>

      {/* Score */}
      <div className="flex items-center gap-1 relative z-10">
        <span className="text-white font-bold text-lg">{formatScore(entry.profit)}</span>
        <Coins className="w-4 h-4 text-yellow-400" />
      </div>
    </div>
  );
};

