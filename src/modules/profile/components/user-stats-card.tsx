import { User } from "@privy-io/react-auth";
import { CopyIcon } from "lucide-react";
import Image from "next/image";
import React from "react";

interface UserStatsCardProps {
  user: User;
}

const UserStatsCard: React.FC<UserStatsCardProps> = ({
  user,
}) => {
  const formatWalletAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPnL = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}$${Math.abs(value).toLocaleString()}`;
  };

  const totalGamesPlayed = 127;
  const pnl = 2450

  const isProfitable = pnl >= 0;

  return (
    <div className="w-full bg-[#0b0a0a]/50 rounded-2xl p-6 border border-white/5">
      {/* User Info Section */}
      <div className="flex flex-col justify-center items-center gap-4 mb-6">
          <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-[#a9062c]/30">
            <Image
              fill
              src={user.farcaster?.pfp ?? ""}
              alt={user.farcaster?.username ?? ""}
              className="object-cover"
            />
          </div>

         <div className="flex flex-col items-center">
         <h3 className="text-xl font-bold text-white mb-1">{user.farcaster?.username}</h3>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 flex items-center gap-2">
              <p className="text-sm text-white/60 font-mono">
                {formatWalletAddress(user.wallet?.address ?? "")}
              </p>
              <button
              onClick={() => navigator.clipboard.writeText(user.wallet?.address ?? "")}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            >
              <CopyIcon className="w-4 h-4 text-white/40 hover:text-white/60" />
            </button>
            </div>
           
          </div>
         </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Games Played */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <p className="text-sm text-white/50 mb-1">Total Games</p>
          <p className="text-2xl font-bold text-white">{totalGamesPlayed}</p>
        </div>

        {/* PnL */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <p className="text-sm text-white/50 mb-1">Total PnL</p>
          <p
            className={`text-2xl font-bold ${
              isProfitable ? "text-green-400" : "text-red-400"
            }`}
          >
            {formatPnL(pnl)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserStatsCard;

