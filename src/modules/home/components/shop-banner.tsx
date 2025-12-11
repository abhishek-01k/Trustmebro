import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useGlobalContext } from "@/context/global-context";
import {
  useActiveGame,
  useConfirmGameCreation,
  useCreateGame,
} from "@/queries/game";
import { ActiveGameResponse } from "@/types/game";
import {
  GAME_CHAIN_ID,
  GAME_CONTRACT_ADDRESS,
  MAX_BET_AMOUNT,
  MIN_BET_AMOUNT,
  USDC_ABI,
  USDC_DECIMALS,
  USDC_TOKEN_ADDRESS,
} from "@/constants/contract";
import {
  createPublicClient,
  decodeEventLog,
  encodeFunctionData,
  http,
  parseUnits,
} from "viem";
import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { MULTIPLIER_GAME_ABI } from "@/lib/contract-abi";
import { sendCalls, waitForCallsStatus, getConnections } from "@wagmi/core";
import { wagmiConfig } from "@/config/wagmi-config";
import { base, baseSepolia } from "viem/chains";

const ShopBanner = () => {
  const { setActiveTab } = useGlobalContext();
  const { wallets } = useWallets();

  const { data: activeGame, isLoading: isLoadingActiveGame } = useActiveGame();
  const { mutateAsync: createGame, isPending: isCreatingGame } =
    useCreateGame();
  const {
    mutateAsync: confirmGameCreation,
    isPending: isConfirmGameCreationPending,
  } = useConfirmGameCreation();

  const [activeGameSession, setActiveGameSession] =
    useState<ActiveGameResponse | null>(null);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [betAmountInput, setBetAmountInput] = useState<string>("0.1");

  useEffect(() => {
    if (activeGame) {
      console.log("activeGame", activeGame);
      setActiveGameSession(activeGame);
    }
  }, [activeGame]);

  console.log("activeGameSession", activeGameSession);

  const executeBlockchainTransaction = async ({
    sessionId,
    preliminaryGameId,
    commitmentHash,
    betAmount,
  }: {
    sessionId: string;
    preliminaryGameId: string;
    commitmentHash: string;
    betAmount: string;
  }) => {
    try {
      const wallet = wallets[0];
      if (!wallet) {
        throw new Error("No wallet available");
      }

      // Check current chain before switching (optimization)
      try {
        const connections = getConnections(wagmiConfig);
        const currentConnection = connections.find(
          (conn) => conn.accounts[0]?.toLowerCase() === wallet.address?.toLowerCase()
        );
        if (currentConnection?.chainId !== GAME_CHAIN_ID) {
          await wallet.switchChain(GAME_CHAIN_ID);
        }
      } catch {
        // If check fails, try switching anyway
        await wallet.switchChain(GAME_CHAIN_ID);
      }

      console.log("GAME_CONTRACT_ADDRESS", GAME_CONTRACT_ADDRESS);
      console.log("preliminaryGameId", preliminaryGameId);
      console.log("commitmentHash", commitmentHash);
      console.log("betAmount", betAmount);

      if (!GAME_CONTRACT_ADDRESS || !USDC_TOKEN_ADDRESS) {
        throw new Error("Contract addresses not configured");
      }

      // Encode the approve function call for USDC
      const approveData = encodeFunctionData({
        abi: USDC_ABI,
        functionName: "approve",
        args: [GAME_CONTRACT_ADDRESS, BigInt(betAmount)],
      });

      // Encode the createGame function call
      const createGameData = encodeFunctionData({
        abi: MULTIPLIER_GAME_ABI,
        functionName: "createGame",
        args: [
          preliminaryGameId as `0x${string}`,
          commitmentHash as `0x${string}`,
          BigInt(betAmount),
        ],
      });

      // Batch approve and createGame calls using sendCalls
      const callsId = await sendCalls(wagmiConfig, {
        account: wallet.address as `0x${string}`,
        chainId: GAME_CHAIN_ID as unknown as 8453,
        calls: [
          {
            to: USDC_TOKEN_ADDRESS,
            data: approveData,
          },
          {
            to: GAME_CONTRACT_ADDRESS,
            data: createGameData,
          },
        ],
      });

      console.log("Calls ID:", callsId.id);

      // Wait for calls to complete and get transaction hash
      const callsStatus = await waitForCallsStatus(wagmiConfig, {
        id: callsId.id,
      });

      console.log("Calls status:", callsStatus);

      // Extract transaction hash and receipt from calls status
      let txHash: `0x${string}` | null = null;
      let receipt: any = null;

      if (
        callsStatus.status === "success" &&
        callsStatus.receipts &&
        callsStatus.receipts.length > 0
      ) {
        // Get the last receipt (which should be the createGame transaction)
        const lastReceipt =
          callsStatus.receipts[callsStatus.receipts.length - 1];
        
        // Try to extract receipt directly from callsStatus
        receipt = lastReceipt;
        
        // Try different possible properties for transaction hash
        txHash =
          (lastReceipt as any).transactionHash ||
          (lastReceipt as any).hash ||
          ((lastReceipt as any).txHash as `0x${string}` | null);
      }

      // Fallback: try to get from the callsStatus object directly
      if (!txHash && (callsStatus as any).transactionHash) {
        txHash = (callsStatus as any).transactionHash as `0x${string}`;
      }

      if (!txHash) {
        console.error(
          "Calls status structure:",
          JSON.stringify(callsStatus, null, 2)
        );
        throw new Error(
          "Failed to get transaction hash from calls status. Check console for details."
        );
      }

      console.log("Transaction hash:", txHash);

      // Create public client for transaction receipt polling
      const selectedChain = GAME_CHAIN_ID === 8453 ? base : baseSepolia;
      const publicClient = createPublicClient({
        chain: selectedChain,
        transport: http(),
      });

      // If we don't have a receipt from callsStatus, try to get it with 0 confirmations
      // This is much faster than waiting for 1 confirmation
      if (!receipt || !receipt.logs) {
        // Use getTransactionReceipt with polling instead of waitForTransactionReceipt
        // This allows us to check immediately without waiting for confirmations
        let attempts = 0;
        const maxAttempts = 10;
        const pollInterval = 200; // 200ms between attempts

        while (attempts < maxAttempts) {
          try {
            receipt = await publicClient.getTransactionReceipt({
              hash: txHash,
            });
            if (receipt) break;
          } catch {
            // Receipt not available yet, wait and retry
          }
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          attempts++;
        }

        if (!receipt) {
          // Fallback to waitForTransactionReceipt with 0 confirmations for faster response
          receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
            confirmations: 0, // Use 0 confirmations for faster response
          });
        }
      }

      console.log("receipt", receipt);

      if (receipt.status !== "success") {
        throw new Error("Transaction failed on-chain");
      }

      // Parse GameCreated event to get onChainGameId
      let onChainGameId: bigint | null = null;
      for (const log of receipt.logs) {
        try {
          const decodedLog = decodeEventLog({
            abi: MULTIPLIER_GAME_ABI,
            data: log.data,
            topics: log.topics,
          });

          if (decodedLog.eventName === "GameCreated") {
            onChainGameId = decodedLog.args.onChainGameId as bigint;
            console.log("onChainGameId >>>>", onChainGameId);
            break;
          }
        } catch {
          continue;
        }
      }

      console.log("onChainGameId", onChainGameId);

      if (!onChainGameId) {
        throw new Error("GameCreated event not found in transaction receipt");
      }

      // Backend call to confirm game creation using the query hook
      // This will automatically invalidate the activeGame query, causing body-section to refetch
      const confirmData = await confirmGameCreation({
        sessionId,
        txHash,
        onChainGameId: onChainGameId.toString(),
      });
      console.log("confirmData", confirmData);

      // The query invalidation in useConfirmGameCreation will trigger a refetch
      // body-section.tsx will automatically detect the new ACTIVE game and show GameScreen
      
      return confirmData;
    } catch (error) {
      console.error("Error executing blockchain transaction:", error);
      toast.error(
        "Failed to execute blockchain transaction. Please try again."
      );
      throw error;
    }
  };

  const handleStartGame = async () => {
    try {
      setIsStartingGame(true);

      // Check if there's a pending game that needs to be retried
      if (activeGame && activeGame.status === "PENDING_CHAIN") {
        console.log("Found pending game, retrying blockchain transaction...");

        if (!activeGame.preliminaryGameId || !activeGame.commitmentHash) {
          throw new Error(
            "Pending game missing required data (preliminaryGameId or commitmentHash)"
          );
        }

        // Retry blockchain transaction with existing game data
        const confirmData = await executeBlockchainTransaction({
          sessionId: activeGame.sessionId,
          preliminaryGameId: activeGame.preliminaryGameId,
          commitmentHash: activeGame.commitmentHash,
          betAmount: activeGame.betAmount,
        });

        console.log("Game retry successful:", confirmData);
        return;
      }
      

      // Validate and convert bet amount from USDC to smallest units (BigInt)
      const betAmountUsdc = parseFloat(betAmountInput);
      if (
        isNaN(betAmountUsdc) ||
        betAmountUsdc < MIN_BET_AMOUNT ||
        betAmountUsdc > MAX_BET_AMOUNT
      ) {
        throw new Error(
          `Bet amount must be between ${MIN_BET_AMOUNT} and ${MAX_BET_AMOUNT} USDC`
        );
      }

      // Convert USDC amount to BigInt in smallest units (multiply by 10^decimals)
      const betAmountBigInt = parseUnits(betAmountInput, USDC_DECIMALS);
      const betAmountString = betAmountBigInt.toString();

      // Generate random tiles per round configuration: 10 rounds, values between 2 and 5
      const defaultTilesPerRound: number[] = Array.from(
        { length: 10 },
        () => Math.floor(Math.random() * 4) + 2
      );

      // Step 1: Backend call to create game session using the query hook
      const createGameData = await createGame({
        betAmount: betAmountString,
        tilesPerRound: defaultTilesPerRound,
      });

      const { sessionId, preliminaryGameId, commitmentHash, betAmount } =
        createGameData;

      // Step 2 & 3: Execute blockchain transaction and confirm
      const confirmData = await executeBlockchainTransaction({
        sessionId,
        preliminaryGameId,
        commitmentHash,
        betAmount,
      });

      console.log("Game started successfully:", confirmData);
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game. Please try again.");
    } finally {
      setIsStartingGame(false);
    }
  };

  // const handleStartGame = () => {
  //   setActiveTab("game");
  // };
  const isLoading =
    isStartingGame || isCreatingGame || isConfirmGameCreationPending;

  return (
    <div className="bg-[#0b0a0a]/50 rounded-2xl p-6 max-w-md w-full shadow-lg">
      <div className="flex justify-center">
        <Button
          className="text-2xl w-full h-12 rounded-full font-game-of-squids bg-gradient-to-b from-[#a9062c] to-[#4e1624] hover:from-[#8d0524] hover:to-[#3d1119] text-white font-semibold uppercase tracking-wide shadow-lg transition-all
          "
          onClick={handleStartGame}
          disabled={isLoading}
        >
          {isLoading ? "Creating Game..." : "Start Game"}
        </Button>
      </div>
    </div>
  );
};

export default ShopBanner;
