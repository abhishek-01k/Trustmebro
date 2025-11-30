"use client";

import React, { useState, useCallback } from 'react'
import GameData from './components/game-data'
import GameTileSection from './components/game-tile-section'
import GameCashOut from './components/game-cash-out'

const StartGame = () => {
  const [betAmount] = useState(0.1); // Initial bet amount
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);

  const handleMultiplierChange = useCallback((roundMultiplier: number) => {
    setCurrentMultiplier(roundMultiplier);
  }, []);

  return (
    <div 
      className='flex flex-col relative h-screen overflow-hidden'
      style={{
        backgroundImage: 'url(/night-fair-image.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className='relative z-10 p-3 shrink-0'>
        <GameData 
          currentMultiplier={currentMultiplier}
          betAmount={betAmount}
        />
      </div>
      
      <GameTileSection 
        onMultiplierChange={handleMultiplierChange}
      />

      <div className='shrink-0'>
        <GameCashOut betAmount={betAmount} />
      </div>

    </div>
  )
}

export default StartGame