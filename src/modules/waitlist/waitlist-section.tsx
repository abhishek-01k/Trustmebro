import React from 'react'
import WaitlistBanner from './components/waitlist-banner'

const WaitlistSection = () => {
  return (
    <div 
      className="flex flex-col items-center justify-between min-h-screen p-4 pb-20 relative"
      style={{
        backgroundImage: 'url(/background_image.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="text-white text-center space-y-2 mt-10 z-10">
        <p className="text-2xl leading-relaxed font-game-of-squids">
        Bet, Pick and win
        </p>
      </div>
      <WaitlistBanner />
    </div>
  )
}

export default WaitlistSection