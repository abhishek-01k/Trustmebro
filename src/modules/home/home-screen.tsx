import React from 'react'
import ShopBanner from './components/shop-banner'

const HomeScreen = () => {
  return (
    <div 
      className="flex flex-col items-center justify-between min-h-screen p-4 pb-32 relative"
      style={{
        backgroundImage: 'url(/background_image.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="text-white text-center space-y-2 mt-10 z-10">
        <p className="text-2xl leading-relaxed font-game-of-squids">
          Bet, Pick and win <br/>
        </p>
      </div>
      <ShopBanner />
    </div>
  )
}

export default HomeScreen