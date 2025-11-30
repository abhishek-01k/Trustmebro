import { cn, formatScore } from '@/src/lib/utils';
import { LeaderboardEntry } from '@/src/types/global';
import Image from 'next/image';
import React from 'react';

const LeaderboardItem = ({ entry, isCurrentUser = false }: { entry: LeaderboardEntry; isCurrentUser?: boolean }) => {
    const isTopThree = entry.rank <= 3;

    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border bg-[#120F23]/60 px-4 py-3 transition-colors",
          isCurrentUser
            ? "bg-[#1A1630]/80 border-[#8C5BFF]/40"
            : "border-white/5 hover:border-white/10 hover:bg-[#120F23]/80"
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Rank */}
          <div
            className={cn(
              "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
              isTopThree
                ? "bg-[#8C5BFF]/20 text-[#8C5BFF]"
                : "bg-[#1A1630] text-white/80",
              isCurrentUser && "bg-[#8C5BFF]/20 text-[#8C5BFF]"
            )}
          >
            {entry.rank}
          </div>

          {/* Profile Picture */}
          <div className="relative shrink-0 w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-[#1A1630]">
            {entry.avatar ? (
              <Image 
                src={entry.avatar} 
                alt={entry.username} 
                fill
                className="object-cover" 
                sizes="40px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-semibold text-sm">
                {entry.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Username and ID */}
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "font-medium truncate text-sm",
                isCurrentUser ? "text-[#8C5BFF]" : "text-white"
              )}
            >
              {entry.username}
            </p>
            {entry.userId && (
              <p className="text-xs text-white/50 truncate">
                ID: {entry.userId}
              </p>
            )}
          </div>
        </div>

        {/* PnL Display */}
        <div className="shrink-0 ml-4 flex items-center gap-1">
          <span className={cn(
            "font-semibold text-sm",
            entry.profit >= 0 ? "text-green-400" : "text-red-400"
          )}>
            {entry.profit >= 0 ? "+" : ""}{formatScore(Math.abs(entry.profit))}
          </span>
        </div>
      </div>
    );
  };

export { LeaderboardItem };