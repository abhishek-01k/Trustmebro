import { CopyIcon, Check } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { UserProfile } from "@/queries/user";
import { formatPnL, formatWalletAddress } from "@/lib/utils";

interface UserStatsCardProps {
  userProfile?: UserProfile;
}

const UserStatsCard: React.FC<UserStatsCardProps> = ({ userProfile }) => {
  const [isCopied, setIsCopied] = useState(false);
  
  const totalGamesPlayed = userProfile?.stats.totalGamesPlayed ?? 0;
  const pnl = userProfile?.stats.netProfit
    ? parseFloat(userProfile.stats.netProfit) / 1e18
    : 0;

  const isProfitable = pnl >= 0;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(userProfile?.walletAddress ?? "");
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <div className="w-full bg-[#0b0a0a]/90 rounded-2xl p-6 border border-white/5">
      {/* User Info Section */}
      <div className="flex flex-col justify-center items-center gap-4 mb-6">
        <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-[#a9062c]/30">
          <Image
            fill
            src={userProfile?.avatarUrl ?? ""}
            alt={userProfile?.username ?? ""}
            className="object-cover"
          />
        </div>

        <div className="flex flex-col items-center">
          <h3 className="text-xl font-bold text-white mb-1">
            {userProfile?.username}
          </h3>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 flex items-center gap-2">
              <p className="text-sm text-white/60 font-mono">
                {formatWalletAddress(userProfile?.walletAddress ?? "")}
              </p>
              <button
                onClick={handleCopyAddress}
                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <CopyIcon className="w-4 h-4 text-white/40 hover:text-white/60" />
                )}
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
