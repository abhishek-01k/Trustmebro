import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const UserStatsCardSkeleton = () => {
  return (
    <div className="w-full bg-[#0b0a0a]/50 rounded-2xl p-6 border border-white/5">
      {/* User Info Section */}
      <div className="flex flex-col justify-center items-center gap-4 mb-6">
        {/* Avatar Skeleton */}
        <Skeleton className="w-20 h-20 rounded-full" />

        {/* Username and Wallet Skeleton */}
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-8 w-44 rounded-lg" />
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Games Skeleton */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>

        {/* PnL Skeleton */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
};

export default UserStatsCardSkeleton;

