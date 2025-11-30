import React, { useMemo, useState } from "react";

const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateRandomNumbers = (count: number = 10): number[] => {
  return Array.from({ length: count }, () => getRandomNumber(2, 5));
};

const GameTileSection = () => {
  const maxRounds = 4;
  const randomNumbers = useMemo(
    () => generateRandomNumbers(maxRounds),
    [maxRounds]
  );
  
  // Track the spotlight row index (starts at 0, which is the first object in the array)
  const [spotlightIndex, setSpotlightIndex] = useState<number>(0);

  const handleTileClick = (originalIndex: number, tileIndex: number) => {
    // Only allow clicks on the spotlight row
    if (originalIndex === spotlightIndex && spotlightIndex < maxRounds - 1) {
      console.log(`Tile clicked: Tile ${tileIndex} in Round ${originalIndex + 1}`);
      setSpotlightIndex(spotlightIndex + 1);
    }
  };

  console.log(randomNumbers);

  return (
    <div className="flex-1 flex flex-col gap-2 items-center justify-center">
      {Array.from({ length: maxRounds })
        .reverse()
        .map((_, rowIndex) => {
          const originalIndex = maxRounds - 1 - rowIndex;
          const isSpotlight = originalIndex === spotlightIndex;
          
          return (
            <div
              key={originalIndex}
              className={`flex gap-2 items-center justify-center ${
                isSpotlight ? "ring-4 ring-yellow-400 ring-opacity-75 rounded-lg p-2" : ""
              }`}
            >
              {Array.from({ length: randomNumbers[originalIndex] }).map(
                (_, colIndex) => (
                  <div
                    key={colIndex}
                    onClick={() => handleTileClick(originalIndex, colIndex)}
                    className={`w-10 h-20 bg-red-500 ${
                      isSpotlight 
                        ? "cursor-pointer hover:bg-red-600 transition-colors shadow-lg shadow-yellow-400/50" 
                        : "opacity-50 cursor-not-allowed"
                    }`}
                  ></div>
                )
              )}
            </div>
          );
        })}
    </div>
  );
};

export default GameTileSection;
