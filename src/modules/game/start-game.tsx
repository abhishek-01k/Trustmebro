import React from 'react'
import GameData from './components/game-data'
import GameTileSection from './components/game-tile-section'

const StartGame = () => {
  return (
    <div 
      className='flex flex-col relative min-h-screen overflow-hidden'
      style={{
        backgroundImage: 'url(/night-fair-image.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className='relative z-10 p-3'>
        <GameData/>
      </div>
      
      <GameTileSection />
    

    </div>
  )
}

export default StartGame