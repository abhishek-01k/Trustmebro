import React from "react";
import { cn } from "../lib/utils";

const LoadingScreen = () => {
  return (
    <div
      className={cn(
        "relative flex min-h-screen w-full flex-col items-center justify-center gap-6 overflow-hidden",
      )}
    >
      <div className="relative flex flex-col items-center justify-center gap-8">
        <div className="relative flex items-center justify-center">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#a9062c] via-[#8d0524] to-[#4e1624] opacity-30 blur-2xl animate-pulse" />
          
          <div className="absolute flex h-[88px] w-[88px] items-center justify-center rounded-full border border-white/10 bg-[#0b0a0a]/70 shadow-[0_0_55px_-15px_rgba(169,6,44,0.6)] backdrop-blur-md">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 border-2 border-[#a9062c] rounded-full"></div>
              <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-12 border-b-[#a9062c]"></div>
              <div className="w-4 h-4 border-2 border-[#a9062c]"></div>
            </div>
          </div>
          
          <div className="absolute inset-0 -z-10 animate-[spin_12s_linear_infinite] rounded-full border border-dashed border-[#a9062c]/40" />
          <div className="absolute inset-3 -z-20 animate-[spin_8s_linear_infinite] rounded-full border border-dashed border-[#4e1624]/25" />
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div className="bg-[#0b0a0a]/50 rounded-2xl px-6 py-3 shadow-lg">
            <h2 className="text-xl font-semibold text-white animate-pulse">
              Loading...
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
