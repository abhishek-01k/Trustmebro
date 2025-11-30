"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface Round {
  roundNumber: number;
  numberOfTiles: number;
  multiplier: number;
  selectedTile: number | null;
}

interface GameTileSectionProps {
  onMultiplierChange: (currentMultiplier: number) => void;
}

const GameTileSection = ({ onMultiplierChange }: GameTileSectionProps) => {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [activeRound, setActiveRound] = useState<number>(1);
  const [totalMultiplier, setTotalMultiplier] = useState<number>(1.0);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeRoundRef = useRef<HTMLDivElement>(null);

  // Initialize rounds on mount
  useEffect(() => {
    const initialRounds: Round[] = [];
    const possibleTiles = [2, 3, 4, 5]; // Possible number of tiles
    
    for (let i = 1; i <= 20; i++) {
      // Random number of tiles between 2-5 (inclusive)
      const randomIndex = Math.floor(Math.random() * possibleTiles.length);
      const numTiles = possibleTiles[randomIndex];
      
      // Calculate multiplier: 1 / (1 - (1 / numberOfTiles))
      const multiplier = 1 / (1 - (1 / numTiles));
      
      initialRounds.push({
        roundNumber: i,
        numberOfTiles: numTiles,
        multiplier: parseFloat(multiplier.toFixed(2)),
        selectedTile: null,
      });
      
      console.log(`Round ${i}: ${numTiles} tiles, multiplier: ${multiplier.toFixed(2)}x`);
    }
    setRounds(initialRounds);
    
    // Set initial multiplier
    if (initialRounds.length > 0) {
      onMultiplierChange(initialRounds[0].multiplier);
    }
  }, [onMultiplierChange]);

  console.log("rounds", rounds);

  // Update multiplier when active round changes
  useEffect(() => {
    const currentRound = rounds.find(r => r.roundNumber === activeRound);
    if (currentRound) {
      onMultiplierChange(currentRound.multiplier);
    }
  }, [activeRound, rounds, onMultiplierChange]);

  // Scroll to active round when it changes (but not on initial load)
  useEffect(() => {
    if (isInitialized && activeRoundRef.current && scrollContainerRef.current) {
      // Small delay to ensure DOM has updated
      requestAnimationFrame(() => {
        activeRoundRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
    }
  }, [activeRound, isInitialized]);

  // Set initial scroll position to bottom only once
  useEffect(() => {
    if (!isInitialized && scrollContainerRef.current && rounds.length > 0) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
          setIsInitialized(true);
        }
      }, 100);
    }
  }, [rounds, isInitialized]);

  const handleTileClick = (roundNumber: number, tileIndex: number) => {
    // Only allow clicking on the active round
    if (roundNumber !== activeRound) {
      return;
    }

    console.log(`Round ${roundNumber}: Tile ${tileIndex + 1} clicked`);

    const currentRound = rounds.find(r => r.roundNumber === roundNumber);
    if (!currentRound) return;

    // Update the selected tile for this round
    setRounds(prevRounds =>
      prevRounds.map(round =>
        round.roundNumber === roundNumber
          ? { ...round, selectedTile: tileIndex }
          : round
      )
    );

    // Update total multiplier by multiplying with current round's multiplier
    const newTotalMultiplier = totalMultiplier * currentRound.multiplier;
    setTotalMultiplier(newTotalMultiplier);

    // Move to next round if available
    if (activeRound < 20) {
      setTimeout(() => {
        setActiveRound(activeRound + 1);
      }, 300);
    } else {
      // Game completed
      onMultiplierChange(currentRound.multiplier);
    }
  };

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 scrollbar-hide flex flex-col-reverse"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <div className="space-y-8 pt-8 flex flex-col-reverse">
        {rounds.map((round) => {
          const isActive = round.roundNumber === activeRound;
          const isCompleted = round.selectedTile !== null;

          return (
            <div
              key={round.roundNumber}
              ref={isActive ? activeRoundRef : null}
              className={`transition-all duration-300 ${
                isActive ? 'scale-100' : 'scale-95 opacity-60'
              }`}
            >
              {/* Round Header */}
              <div className="mb-4 text-center">
                <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3">
                  <span className={`text-sm font-medium ${
                    isActive ? 'text-[#8C5BFF]' : 'text-white/70'
                  }`}>
                    Round {round.roundNumber}
                  </span>
                  <div className="w-px h-4 bg-white/20" />
                  <span className={`text-lg font-bold ${
                    isActive ? 'text-[#ed1b76]' : 'text-white/70'
                  }`}>
                    {round.multiplier}x
                  </span>
                  {isCompleted && (
                    <>
                      <div className="w-px h-4 bg-white/20" />
                      <span className="text-green-400 text-xs">✓ Selected</span>
                    </>
                  )}
                </div>
              </div>

              {/* Tiles Container */}
              <div className="relative">
                <div 
                  className="flex gap-2 pb-2 justify-center"
                >
                  {Array.from({ length: round.numberOfTiles }).map((_, tileIndex) => {
                    const isSelected = round.selectedTile === tileIndex;
                    
                    return (
                      <div
                        key={tileIndex}
                        onClick={() => handleTileClick(round.roundNumber, tileIndex)}
                        className={`transition-all duration-300 ${
                          isActive ? 'cursor-pointer' : 'cursor-not-allowed'
                        }`}
                        style={{
                          width: '70px',
                          maxWidth: '70px',
                          minWidth: '70px',
                        }}
                      >
                        <div
                          className={`
                            relative rounded-2xl overflow-hidden transition-all duration-300
                            ${isActive && !isCompleted ? 'border-[#8C5BFF] shadow-lg shadow-[#8C5BFF]/30 hover:scale-105' : ''}
                            ${isSelected ? 'border-[#ed1b76] shadow-lg shadow-[#ed1b76]/50' : 'border-white/10'}
                            ${!isActive ? 'opacity-50' : ''}
                          `}
                        >
                          {/* Tile Image */}
                          <div className="relative aspect-3/4 w-full">
                            <Image
                              src="/tile-image.png"
                              alt={`Tile ${tileIndex + 1}`}
                              fill
                              className="object-cover"
                              priority
                            />
                            
                            {/* Overlay for inactive tiles */}
                            {!isActive && (
                              <div className="absolute inset-0 bg-black/40" />
                            )}
                            
                            {/* Selected indicator */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#ed1b76]/20 flex items-center justify-center">
                                <div className="bg-[#ed1b76] rounded-full p-3">
                                  <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* End of Game Message */}
        {activeRound > 20 && (
          <div className="text-center pb-8">
            <div className="inline-flex flex-col items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-8 py-6">
              <span className="text-2xl">🎉</span>
              <p className="text-white text-lg font-bold">Game Complete!</p>
              <p className="text-white/70 text-sm">You completed all 20 rounds</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameTileSection;