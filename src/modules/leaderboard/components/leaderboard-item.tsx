import { cn, formatScore } from '@/lib/utils';
import { LeaderboardEntry } from '@/types/global';
import Image from 'next/image';
import React from 'react';

const LeaderboardItem = ({ entry, isCurrentUser = false }: { entry: LeaderboardEntry; isCurrentUser?: boolean }) => {
    const isTopThree = entry.rank <= 3;

    return (
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 transition-all duration-300 ease-in-out",
          isCurrentUser
            ? "rounded-lg bg-gradient-to-b from-[#a9062c] to-[#4e1624] hover:from-[#8d0524] hover:to-[#3d1119] shadow-lg"
            : "rounded-lg border backdrop-blur-sm bg-[#0b0a0a]/50 border-white/10 hover:border-white/20 hover:bg-[#0b0a0a]/70"
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Rank */}
          <div
            className={cn(
              "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
              isTopThree && !isCurrentUser
                ? "bg-[#8C5BFF]/30 text-[#8C5BFF] backdrop-blur-sm"
                : isCurrentUser
                ? "bg-white/20 text-white"
                : "bg-white/10 text-white/80 backdrop-blur-sm"
            )}
          >
            {entry.rank}
          </div>

          {/* Profile Picture */}
          <div className={cn(
            "relative shrink-0 w-10 h-10 rounded-full border overflow-hidden",
            isCurrentUser
              ? "border-white/20 bg-white/20"
              : "border-white/10 bg-white/10 backdrop-blur-sm"
          )}>
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
                "truncate text-sm",
                isCurrentUser 
                  ? "text-white font-semibold uppercase tracking-wide" 
                  : "text-white font-medium"
              )}
            >
              {entry.username}
            </p>
            {entry.userId && (
              <p className={cn(
                "text-xs truncate",
                isCurrentUser ? "text-white/70" : "text-white/50"
              )}>
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