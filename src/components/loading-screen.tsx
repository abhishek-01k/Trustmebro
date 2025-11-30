import React from "react";
import Image from "next/image";
import { cn } from "../lib/utils";

const LoadingScreen = () => {
  return (
    <div
      className={cn(
        "relative flex min-h-screen w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-[#110F1F]/90 via-[#0B0915]/75 to-[#08070F]/90 px-10 py-12 text-center text-white shadow-[0_35px_80px_-40px_rgba(108,77,217,0.85)]",
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-[#6D40C6]/35 via-transparent to-transparent blur-3xl" />
      <div className="relative flex flex-col items-center justify-center gap-8">
        <div className="relative flex items-center justify-center">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#8C5BFF] via-[#6D40C6] to-[#382080] opacity-30 blur-2xl animate-[pulse_2.8s_ease-in-out_infinite]" />
          <div className="absolute flex h-[88px] w-[88px] items-center justify-center rounded-full border border-white/10 bg-[#120F23]/70 shadow-[0_0_55px_-15px_rgba(140,91,255,0.9)] backdrop-blur-md">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#1A1630]/60 shadow-inner">
              <Image
                src="/logo.png"
                alt="Swipy logo"
                width={64}
                height={64}
                className="h-full w-full animate-[spin_6s_linear_infinite]"
                priority
              />
            </div>
          </div>
          <div className="absolute inset-0 -z-10 animate-[spin_12s_linear_infinite] rounded-full border border-dashed border-[#8C5BFF]/40" />
          <div className="absolute inset-3 -z-20 animate-[spin_8s_linear_infinite] rounded-full border border-dashed border-[#382080]/25" />
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold text-white/90 animate-pulse">
            Loading...
          </h2>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
