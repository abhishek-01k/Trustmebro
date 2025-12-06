"use client";

import { useActiveGame, useSelectTile, useCashOut } from "@/queries/game";
import { useEffect, useState, useCallback, useMemo } from "react";
import { formatUnits } from "viem";
import { toast } from "sonner";
import { useGlobalContext } from "@/context/global-context";

interface TileData {
  id: number;
  isDeath: boolean;
  isRevealed: boolean;
  isSelected: boolean;
}

interface LevelData {
  level: number;
  tiles: TileData[];
  multiplier: number;
  isCompleted: boolean;
  selectedTileId: number | null;
}

export default function GamePage() {
  return <GameScreen />;
}

export function GameScreen() {
  const { data: activeGame, isLoading: isLoadingActiveGame } = useActiveGame();
  const { mutateAsync: selectTile, isPending: isSelectingTile } = useSelectTile();
  const { mutateAsync: cashOut, isPending: isCashingOut } = useCashOut();
  const { setActiveTab } = useGlobalContext();

  const [levels, setLevels] = useState<LevelData[]>([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [totalMultiplier, setTotalMultiplier] = useState(1.0);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">(
    "playing"
  );
  const [playerPosition, setPlayerPosition] = useState({
    level: 0,
    tileIndex: -1,
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [betAmount, setBetAmount] = useState(0);
  const [viewOffset, setViewOffset] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successTileInfo, setSuccessTileInfo] = useState<{
    levelIndex: number;
    tileId: number;
  } | null>(null);
  const [potentialPayout, setPotentialPayout] = useState<string | null>(null);

  // Initialize game from activeGame data
  useEffect(() => {
    if (!activeGame || activeGame.status !== "ACTIVE") {
      return;
    }

    setSessionId(activeGame.sessionId);
    
    // Set bet amount
    const betAmountUsdc = parseFloat(formatUnits(BigInt(activeGame.betAmount), 6));
    setBetAmount(betAmountUsdc);

    // Initialize levels from rowConfigs
    const initialLevels: LevelData[] = activeGame.rowConfigs.map((rowConfig, index) => {
      const tiles: TileData[] = Array.from({ length: rowConfig.tiles }, (_, i) => ({
        id: i,
        isDeath: false, // We don't know which tile is death until revealed
        isRevealed: false,
        isSelected: false,
      }));

      return {
        level: index + 1,
        tiles,
        multiplier: activeGame.multipliers[index] || 1,
        isCompleted: index < activeGame.currentRow,
        selectedTileId: null,
      };
    });

    setLevels(initialLevels);
    setCurrentLevel(activeGame.currentRow + 1); // currentRow is 0-indexed
    setTotalMultiplier(activeGame.currentMultiplier);
    setPotentialPayout(activeGame.potentialPayout);
  }, [activeGame]);

  // Scroll handlers
  const handleScrollUp = useCallback(() => {
    setViewOffset((prev) =>
      Math.min(prev + 1, levels.length - currentLevel - 1)
    );
  }, [levels.length, currentLevel]);

  const handleScrollDown = useCallback(() => {
    setViewOffset((prev) => Math.max(prev - 1, 0));
  }, []);

  // Reset view offset when level changes
  useEffect(() => {
    setViewOffset(0);
  }, [currentLevel]);

  const handleTileSelect = useCallback(
    async (levelIndex: number, tileId: number) => {
      if (gameState !== "playing" || isAnimating || isSelectingTile) return;
      if (levelIndex !== currentLevel - 1) return;
      if (!sessionId) return;

      const level = levels[levelIndex];
      if (!level || level.isCompleted) return;

      setIsAnimating(true);

      // Only mark tile as selected (not revealed yet) - wait for backend response
      setLevels((prev) =>
        prev.map((lvl, idx) => {
          if (idx === levelIndex) {
            return {
              ...lvl,
              selectedTileId: tileId,
              tiles: lvl.tiles.map((t) => ({
                ...t,
                isSelected: t.id === tileId,
                isRevealed: false, // Don't reveal until we know the result
              })),
            };
          }
          return lvl;
        })
      );

      setPlayerPosition({ level: levelIndex + 1, tileIndex: tileId });

      try {
        // Call API to select tile
        const response = await selectTile({
          sessionId,
          tileIndex: tileId,
        });

        // Wait a bit for animation before revealing
        await new Promise((resolve) => setTimeout(resolve, 300));

        if (response.result === "DEATH") {
          // Reveal all tiles including death tile
          setLevels((prev) =>
            prev.map((lvl, idx) => {
              if (idx === levelIndex) {
                return {
                  ...lvl,
                  tiles: lvl.tiles.map((t) => ({
                    ...t,
                    isRevealed: true,
                    isDeath: t.id === response.deathTileIndex,
                  })),
                };
              }
              return lvl;
            })
          );

          setTimeout(() => {
            setGameState("lost");
            setIsAnimating(false);
          }, 600);
        } else {
          // Safe tile - reveal the selected tile as safe
          setLevels((prev) =>
            prev.map((lvl, idx) => {
              if (idx === levelIndex) {
                return {
                  ...lvl,
                  isCompleted: true,
                  tiles: lvl.tiles.map((t) => ({
                    ...t,
                    isRevealed: t.id === tileId, // Only reveal the selected safe tile
                    isDeath: false,
                  })),
                };
              }
              return lvl;
            })
          );

          // Show success animation and feedback
          setSuccessTileInfo({ levelIndex, tileId });
          setShowSuccessAnimation(true);
          
          // Show success toast
          toast.success(`Safe! Multiplier: ${(response.currentMultiplier || totalMultiplier).toFixed(2)}x`, {
            duration: 2000,
          });

          // Update multiplier and potential payout immediately for visual feedback
          setTotalMultiplier(response.currentMultiplier || totalMultiplier);
          if (response.potentialPayout) {
            setPotentialPayout(response.potentialPayout);
          }

          // Wait for success animation to play before moving to next level
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Hide success animation
          setShowSuccessAnimation(false);
          setSuccessTileInfo(null);

          // Now update to next level
          setCurrentLevel((response.currentRow || currentLevel) + 1);
          setIsAnimating(false);

          if (response.isLastRow && sessionId) {
            // Automatically cash out if last row
            setTimeout(async () => {
              try {
                const cashOutResponse = await cashOut({ sessionId });
                setGameState("won");
                setTotalMultiplier(cashOutResponse.finalMultiplier);
                toast.success(`You cashed out! Won ${formatUnits(BigInt(cashOutResponse.playerReceives), 6)} USDC`);
              } catch (error) {
                console.error("Error cashing out:", error);
                toast.error("Failed to cash out. Please try again.");
              }
            }, 500);
          }
        }
      } catch (error) {
        console.error("Error selecting tile:", error);
        toast.error("Failed to select tile. Please try again.");
        setIsAnimating(false);
        // Reset UI state
        setLevels((prev) =>
          prev.map((lvl, idx) => {
            if (idx === levelIndex) {
              return {
                ...lvl,
                selectedTileId: null,
                tiles: lvl.tiles.map((t) => ({
                  ...t,
                  isSelected: false,
                  isRevealed: false,
                })),
              };
            }
            return lvl;
          })
        );
      }
    },
    [
      gameState,
      isAnimating,
      isSelectingTile,
      currentLevel,
      levels,
      totalMultiplier,
      sessionId,
      selectTile,
      cashOut,
    ]
  );

  const handleCashOut = useCallback(async () => {
    if (gameState !== "playing" || currentLevel <= 1 || !sessionId || isCashingOut) {
      return;
    }

    try {
      const response = await cashOut({ sessionId });
      
      setGameState("won");
      setTotalMultiplier(response.finalMultiplier);
      toast.success(`You cashed out! Won ${formatUnits(BigInt(response.playerReceives), 6)} USDC`);
    } catch (error) {
      console.error("Error cashing out:", error);
      toast.error("Failed to cash out. Please try again.");
    }
  }, [gameState, currentLevel, sessionId, isCashingOut, cashOut]);

  // Get visible levels - current + next 4 upcoming only
  const visibleLevels = useMemo(() => {
    const startIdx = currentLevel - 1 + viewOffset;
    const endIdx = Math.min(levels.length, startIdx + 5);
    return levels.slice(startIdx, endIdx);
  }, [levels, currentLevel, viewOffset]);

  const toWin = potentialPayout
    ? formatUnits(BigInt(potentialPayout), 6)
    : activeGame
    ? formatUnits(BigInt(activeGame.potentialPayout), 6)
    : (betAmount * totalMultiplier).toFixed(2);

  // Show loading state if game data is not ready (but only if we're not showing game over screens)
  if (isLoadingActiveGame && gameState === "playing") {
    return (
      <div className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-[#0a0a12]">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  // Particle pattern for tiles - uses seed for consistent pattern
  const ParticlePattern = ({
    width = 60,
    height = 80,
    seed = 0,
  }: {
    width?: number;
    height?: number;
    seed?: number;
  }) => {
    // Simple seeded random function
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    // Generate stable particle positions based on seed
    const particles = Array.from({ length: 12 }, (_, i) => {
      const r1 = seededRandom(seed + i);
      const r2 = seededRandom(seed + i + 100);
      const r3 = seededRandom(seed + i + 200);
      const r4 = seededRandom(seed + i + 300);
      const r5 = seededRandom(seed + i + 400);

      return {
        x: r1 * (width - 8) + 4,
        y: r2 * (height - 8) + 4,
        size: r3 * 3 + 2,
        color: r4 > 0.5 ? "#fb923c" : "#60a5fa", // Orange or blue
        opacity: r5 * 0.6 + 0.4,
      };
    });

    return (
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle, idx) => (
          <div
            key={idx}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex items-center justify-center"
      style={{
        background: "#0a0a12",
      }}
    >
      {/* Game Container Frame */}
      <div
        className="relative h-full w-full sm:w-[92%] md:w-[85%] max-h-[900px] rounded-none sm:rounded-3xl overflow-hidden flex flex-col"
        style={{
          maxWidth: "650px",
          border: "2px solid rgba(255, 180, 100, 0.3)",
          backgroundImage: "url(/bg.jpeg)",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {/* Top Stats Row */}
        <div
          className={`flex gap-3 p-4 ${
            gameState !== "playing" ? "invisible" : ""
          }`}
        >
          <div
            className="flex-1 rounded-2xl p-4"
            style={{
              border: "1px solid rgba(255, 180, 100, 0.4)",
              background: "rgba(10, 10, 20, 0.85)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="text-amber-400/70 text-sm mb-1">Multiplier</div>
            <div className="text-white text-2xl font-bold">
              {totalMultiplier.toFixed(2)}x
            </div>
          </div>

          <div
            className="flex-1 rounded-2xl p-4"
            style={{
              border: "1px solid rgba(255, 180, 100, 0.4)",
              background: "rgba(10, 10, 20, 0.85)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="text-amber-400/70 text-sm mb-1">To win</div>
            <div className="text-white text-2xl font-bold">{toWin}</div>
          </div>
        </div>

        {/* Game Area with 3D Perspective */}
        <div
          className={`flex-1 relative overflow-hidden ${
            gameState !== "playing" ? "invisible" : ""
          }`}
          style={{ perspective: "800px", perspectiveOrigin: "center 80%" }}
        >
          {/* Perspective Bridge - Solid purple gradient like reference */}
          <div
            className="absolute pointer-events-none"
            style={{
              // background: 'linear-gradient(180deg, rgba(88, 28, 135, 0.95) 0%, rgba(126, 34, 206, 0.9) 40%, rgba(147, 51, 234, 0.85) 100%)',
              background:
                "linear-gradient(rgb(0 0 0 / 95%) 0%, rgb(3 3 3 / 90%) 40%, rgb(145 23 255 / 85%) 100%)",
              width: "100%",
              height: "55%",
              left: 0,
              bottom: 0,
              clipPath: "polygon(44% 0%, 56% 0%, 100% 100%, 0% 100%)",
            }}
          />

          {/* Neon grid lines overlay */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: "100%",
              height: "55%",
              left: 0,
              bottom: 0,
              clipPath: "polygon(44% 0%, 56% 0%, 100% 100%, 0% 100%)",
              backgroundImage: `
                linear-gradient(rgba(168, 85, 247, 0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(168, 85, 247, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: "50px 35px",
            }}
          />

          {/* Scroll Buttons */}
          <div className="absolute right-4 top-1/3 -translate-y-1/2 flex flex-col gap-2 z-10">
            <button
              onClick={handleScrollUp}
              disabled={viewOffset >= levels.length - currentLevel - 1}
              className="p-3 backdrop-blur-sm border border-amber-700 rounded-lg hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 shadow-lg"
              style={{
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              }}
              aria-label="Scroll up"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-amber-900"
              >
                <path d="m18 15-6-6-6 6"></path>
              </svg>
            </button>
            <button
              onClick={handleScrollDown}
              disabled={viewOffset <= 0}
              className="p-3 backdrop-blur-sm border border-amber-700 rounded-lg hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 shadow-lg"
              style={{
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              }}
              aria-label="Scroll down"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-amber-900"
              >
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </button>
          </div>

          {/* Levels Container - tiles stacked on perspective line */}
          <div className="absolute inset-0 flex flex-col items-center justify-end overflow-hidden">
            {[...visibleLevels].reverse().map((level, reverseIdx) => {
              const idx = visibleLevels.length - 1 - reverseIdx;
              const actualIndex = levels.findIndex(
                (l) => l.level === level.level
              );
              const distanceFromCurrent = idx;
              const isCurrentLevel = idx === 0 && viewOffset === 0;
              const isViewingLevel = idx === 0;

              // Position tiles ON the perspective line - current at bottom edge, upcoming stacked tightly above
              // Current tile: at bottom with gap from edge
              // Upcoming tiles: stacked with small gaps, staying within perspective line
              const baseBottom = isViewingLevel
                ? 25
                : 140 + distanceFromCurrent * 40;

              // Scale decreases quickly to fit within the narrowing perspective
              const scale = isViewingLevel
                ? 1
                : Math.max(0.2, 0.55 - distanceFromCurrent * 0.1);

              // Opacity and blur - fade more aggressively
              const opacity = isViewingLevel
                ? 1
                : Math.max(0.25, 0.8 - distanceFromCurrent * 0.18);
              const brightness = isViewingLevel
                ? 1
                : Math.max(0.4, 0.75 - distanceFromCurrent * 0.12);
              const blur = isViewingLevel
                ? 0
                : Math.min(2, distanceFromCurrent * 0.5);

              return (
                <div
                  key={level.level}
                  className="absolute left-1/2 transition-all duration-500 ease-out"
                  style={{
                    transform: `translateX(-50%) scale(${scale})`,
                    transformOrigin: "center bottom",
                    opacity,
                    filter: `brightness(${brightness}) blur(${blur}px)`,
                    zIndex: 100 - distanceFromCurrent,
                    bottom: `${baseBottom}px`,
                    pointerEvents: isViewingLevel ? "auto" : "none",
                  }}
                >
                  <div
                    style={{ pointerEvents: isViewingLevel ? "auto" : "none" }}
                  >
                    <div className="flex flex-col items-center justify-center">
                      {/* Tiles container */}
                      <div
                        className={`${
                          isViewingLevel ? "rounded-lg p-2" : "rounded-md p-2"
                        }`}
                      >
                        <div
                          className={`flex flex-row items-center justify-center ${
                            isViewingLevel ? "gap-3" : "gap-1.5"
                          }`}
                        >
                          {level.tiles.map((tile) => {
                            const isPlayerHere =
                              playerPosition.level === level.level &&
                              playerPosition.tileIndex === tile.id;
                            
                            const isSuccessTile =
                              showSuccessAnimation &&
                              successTileInfo &&
                              successTileInfo.levelIndex === actualIndex &&
                              successTileInfo.tileId === tile.id;

                            // For upcoming levels - smaller arch tiles
                            if (!isViewingLevel) {
                              return (
                                <div
                                  key={tile.id}
                                  className="rounded-t-full"
                                  style={{
                                    width: "28px",
                                    height: "36px",
                                    background:
                                      "linear-gradient(180deg, rgba(147, 197, 253, 0.6) 0%, rgba(96, 165, 250, 0.4) 100%)",
                                    border:
                                      "1.5px solid rgba(255, 255, 255, 0.4)",
                                    boxShadow:
                                      "inset 0 2px 4px rgba(255,255,255,0.2)",
                                  }}
                                />
                              );
                            }

                            // Current level - full glass tiles
                            return (
                              <button
                                key={tile.id}
                                onClick={() =>
                                  handleTileSelect(actualIndex, tile.id)
                                }
                                disabled={
                                  !isCurrentLevel ||
                                  level.isCompleted ||
                                  isAnimating ||
                                  gameState !== "playing"
                                }
                                className={`
                                  relative rounded-lg overflow-hidden
                                  ${
                                    isCurrentLevel &&
                                    !level.isCompleted &&
                                    gameState === "playing"
                                      ? "cursor-pointer hover:brightness-110"
                                      : "cursor-default"
                                  }
                                `}
                                style={{
                                  width: "60px",
                                  height: "80px",
                                  background: tile.isRevealed
                                    ? tile.isDeath
                                      ? "linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)"
                                      : "linear-gradient(180deg, #4ade80 0%, #22c55e 100%)"
                                    : "rgba(0, 0, 0, 0.3)",
                                  border: tile.isRevealed
                                    ? isSuccessTile
                                      ? "3px solid rgba(74, 222, 128, 0.9)"
                                      : "2px solid rgba(255, 255, 255, 0.5)"
                                    : "2px solid #60a5fa",
                                  boxShadow: tile.isRevealed
                                    ? isSuccessTile
                                      ? "0 0 40px rgba(74, 222, 128, 0.8), 0 0 80px rgba(74, 222, 128, 0.6), inset 0 0 30px rgba(74, 222, 128, 0.4)"
                                      : "0 2px 8px rgba(0,0,0,0.3)"
                                    : "0 0 20px rgba(96, 165, 250, 0.6), inset 0 0 20px rgba(96, 165, 250, 0.2)",
                                  transform: isSuccessTile
                                    ? "rotateX(35deg) rotateY(0deg) translateZ(0) scale(1.15)"
                                    : "rotateX(35deg) rotateY(0deg) translateZ(0)",
                                  transformStyle: "preserve-3d",
                                  transformOrigin: "center bottom",
                                  transition:
                                    "transform 0.3s ease-out, filter 0.3s ease-out, box-shadow 0.3s ease-out, border 0.3s ease-out",
                                  animation: isSuccessTile ? "successPulse 1.5s ease-out" : "none",
                                }}
                                onMouseEnter={(e) => {
                                  if (
                                    isCurrentLevel &&
                                    !level.isCompleted &&
                                    gameState === "playing"
                                  ) {
                                    e.currentTarget.style.transform =
                                      "rotateX(35deg) rotateY(0deg) translateZ(8px) scale(1.05)";
                                    e.currentTarget.style.boxShadow =
                                      "0 0 30px rgba(96, 165, 250, 0.8), inset 0 0 25px rgba(96, 165, 250, 0.3)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform =
                                    "rotateX(35deg) rotateY(0deg) translateZ(0)";
                                  e.currentTarget.style.boxShadow =
                                    tile.isRevealed
                                      ? "0 2px 8px rgba(0,0,0,0.3)"
                                      : "0 0 20px rgba(96, 165, 250, 0.6), inset 0 0 20px rgba(96, 165, 250, 0.2)";
                                }}
                                onMouseDown={(e) => {
                                  if (
                                    isCurrentLevel &&
                                    !level.isCompleted &&
                                    gameState === "playing"
                                  ) {
                                    e.currentTarget.style.transform =
                                      "rotateX(35deg) rotateY(0deg) translateZ(0) scale(0.95)";
                                  }
                                }}
                                onMouseUp={(e) => {
                                  if (
                                    isCurrentLevel &&
                                    !level.isCompleted &&
                                    gameState === "playing"
                                  ) {
                                    e.currentTarget.style.transform =
                                      "rotateX(35deg) rotateY(0deg) translateZ(0)";
                                  }
                                }}
                              >
                                {!tile.isRevealed && (
                                  <ParticlePattern
                                    width={60}
                                    height={80}
                                    seed={tile.id + level.level * 100}
                                  />
                                )}
                                <div className="flex flex-col items-center justify-center h-full relative z-10">
                                  {tile.isRevealed && (
                                    <span className="text-3xl">
                                      {tile.isDeath ? "💔" : "✓"}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Level label */}
                      <div
                        className="flex flex-row items-center justify-center gap-3 px-3 py-1 rounded-t-sm"
                        // style={{
                        //   background: isViewingLevel
                        //     ? "rgba(30, 30, 50, 0.6)"
                        //     : "rgba(30, 30, 50, 0.4)",
                        //   border: "1px solid rgba(96, 165, 250, 0.3)",
                        // }}
                      >
                        <div
                          className="flex-1 h-0.5 w-15"
                          style={{
                            background: "rgba(96, 165, 250, 0.4)",
                          }}
                        />
                        <span
                          className={`text-blue-300 font-bold whitespace-nowrap ${
                            isViewingLevel ? "text-lg" : "text-sm"
                          }`}
                          style={{
                            textShadow: "0 0 8px rgba(96, 165, 250, 0.5)",
                          }}
                        >
                          {level.multiplier.toFixed(2)}x
                        </span>
                        <div
                          className="flex-1 h-0.5 w-15"
                          style={{
                            background: "rgba(96, 165, 250, 0.4)",
                          }}
                        />
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Section */}
        <div
          className={`p-4 flex flex-col gap-3 ${
            gameState !== "playing" ? "invisible" : ""
          }`}
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(10, 10, 20, 0.9) 100%)",
          }}
        >
          <div className="text-center text-amber-200/70 text-base font-medium">
            Bet: {betAmount > 0 ? betAmount.toFixed(2) : activeGame ? formatUnits(BigInt(activeGame.betAmount), 6) : "0.00"} USDC
          </div>

          <div className="flex justify-center">
            <button
              onClick={currentLevel > 1 ? handleCashOut : undefined}
              disabled={currentLevel <= 1 || gameState !== "playing"}
              className={` py-3 px-12 rounded-xl text-base border-2 border-amber-300/30 transition-all duration-200 ease-out ${
                currentLevel > 1 && gameState === "playing"
                  ? "bg-gradient-to-br from-amber-400 to-amber-600 text-amber-900 font-bold hover:brightness-110 active:scale-[0.98] shadow-lg shadow-amber-400/40"
                  : "bg-[rgba(30,30,50,0.8)] text-white font-medium opacity-40 cursor-not-allowed"
              }`}
            >
              Cash out
            </button>
          </div>
        </div>
      </div>

      {/* Game Over - ELIMINATED */}
      {gameState === "lost" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-50"
          style={{
            backgroundImage:
              "linear-gradient(rgba(10, 10, 18, 0.92), rgba(10, 10, 18, 0.92)), url(/bg.jpeg)",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <div className="text-8xl mb-6">💔</div>
          <h2 className="text-5xl font-bold text-red-400 mb-4 tracking-wider">
            oh no!
          </h2>
          <p className="text-lg text-amber-200/50 text-center mb-10">
            You lost the game
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("home")}
              className="px-10 py-4 rounded-xl font-bold text-lg hover:brightness-110 active:scale-95"
              style={{
                background: "rgba(30, 30, 50, 0.9)",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                color: "#ffffff",
                transition: "all 0.2s ease-out",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

      {/* Win - SURVIVED */}
      {gameState === "won" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-50"
          style={{
            backgroundImage:
              "linear-gradient(rgba(10, 10, 18, 0.88), rgba(10, 10, 18, 0.88)), url(/bg.jpeg)",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <div className="text-8xl mb-6">🏆</div>
          <h2 className="text-5xl font-bold text-amber-400 mb-4 tracking-wider">
            SURVIVED!
          </h2>
          <div className="text-center mb-6">
            <p className="text-xl text-amber-200/70">You crossed</p>
            <p className="text-xl text-amber-200/70">
              {currentLevel - 1} glass panels
            </p>
          </div>
          <p className="text-5xl font-bold text-white mb-3">
            {totalMultiplier.toFixed(2)}x
          </p>
          <p className="text-2xl text-amber-400 mb-10">Won: {toWin} USDC</p>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("home")}
              className="px-10 py-4 rounded-xl font-bold text-lg hover:brightness-110 active:scale-95"
              style={{
                background: "rgba(30, 30, 50, 0.9)",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                color: "#ffffff",
                transition: "all 0.2s ease-out",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateX(-50%) translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(150px) rotate(180deg);
            opacity: 0;
          }
        }

        @keyframes bounce {
          0%,
          100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(-12px);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes successPulse {
          0% {
            transform: rotateX(35deg) rotateY(0deg) translateZ(0) scale(1);
            box-shadow: 0 0 20px rgba(74, 222, 128, 0.6), inset 0 0 20px rgba(74, 222, 128, 0.2);
          }
          50% {
            transform: rotateX(35deg) rotateY(0deg) translateZ(0) scale(1.2);
            box-shadow: 0 0 50px rgba(74, 222, 128, 1), 0 0 100px rgba(74, 222, 128, 0.8), inset 0 0 40px rgba(74, 222, 128, 0.5);
          }
          100% {
            transform: rotateX(35deg) rotateY(0deg) translateZ(0) scale(1.15);
            box-shadow: 0 0 40px rgba(74, 222, 128, 0.8), 0 0 80px rgba(74, 222, 128, 0.6), inset 0 0 30px rgba(74, 222, 128, 0.4);
          }
        }
      `}</style>
    </div>
  );
}
