import React, { useMemo } from "react";
import { useFundWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { useReadContract } from "wagmi";
import { base } from "wagmi/chains";
import { USDC_ADDRESS, USDC_DECIMALS, USDC_ABI } from "@/constants";
import { formatUnits } from "viem";
import { PlusIcon, Wallet } from "lucide-react";
import { Button } from "../ui/button";

const HeaderSection = () => {
  const { fundWallet } = useFundWallet();
  const { user,logout } = usePrivy();
  const { wallets } = useWallets();

  console.log("User", user);
  console.log("Wallets", wallets);

  const walletAddress = wallets[0]?.address as `0x${string}` | undefined;

  const { data: balance, isLoading } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: walletAddress ? [walletAddress] : undefined,
    chainId: base.id,
    query: {
      enabled: !!walletAddress,
    },
  });

  const usdcBalance = useMemo(() => {
    if (!balance || typeof balance !== "bigint") return 0;
    return parseFloat(formatUnits(balance, USDC_DECIMALS));
  }, [balance]);

  return (
    <header className="flex items-center gap-3 px-4 py-3 backdrop-blur-xl bg-[#0d0c12] border-white/10 to-transparent">
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 border-2 border-[#a9062c] rounded-full"></div>
        <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-12 border-b-[#a9062c]"></div>
        <div className="w-4 h-4 border-2 border-[#a9062c]"></div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* USDC Balance Display */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10">
          <Wallet className="w-4 h-4 text-red-500" />
          <div className="flex items-baseline gap-1">
            {isLoading ? (
              <span className="text-sm animate-pulse text-gray-400">
                Loading...
              </span>
            ) : (
              <>
                <span className="text-sm font-semibold text-white">
                  {usdcBalance.toFixed(2)}
                </span>
                <span className="text-xs font-medium text-gray-400">
                  USDC
                </span>
              </>
            )}
          </div>
          <button
            onClick={() => {
              const address = user?.wallet?.address;
              if (address) {
                fundWallet({ address });
              }
            }}
            disabled={!wallets[0]?.address}
            className={`ml-2 p-1 rounded transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-[#a9062c] border border-pink-500/40 ${
              wallets[0]?.address ? "" : ""
            }`}
          >
            <PlusIcon className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default HeaderSection;
