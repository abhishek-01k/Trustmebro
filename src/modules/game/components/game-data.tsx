"use client";

import React from "react";

interface GameDataProps {
  currentMultiplier: number;
  betAmount: number;
}

const GameData = ({ currentMultiplier, betAmount }: GameDataProps) => {
  // Calculate potential winnings
  const potentialWin = (betAmount * currentMultiplier).toFixed(2);

  return (
    <div className="flex gap-4 ">
      <div className="flex-1 flex flex-col rounded-2xl border bg-linear-to-b from-[#2a282b] to-[#070405] border-white/10 p-4 shadow-lg">
        <p className="text-gray-400 text-sm">Multiplier</p>
        <p className="text-white text-2xl font-semibold">{currentMultiplier.toFixed(2)}x</p>
      </div>
      <div className="flex-1 flex flex-col rounded-2xl border bg-linear-to-b from-[#2a282b] to-[#070405] border-white/10 p-4 shadow-lg">
        <p className="text-gray-400 text-sm">To Win</p>
        <p className="text-2xl font-semibold text-[#ed1b76]">$ {potentialWin}</p>
      </div>
    </div>
  );
};

export default GameData;
