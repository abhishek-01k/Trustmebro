import React from 'react'
import ShopBanner from './components/shop-banner'

const HomeScreen = () => {
  return (
    <div 
      className="flex items-end justify-center min-h-screen p-4 pb-32"
      style={{
        backgroundImage: 'url(/background_image.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <ShopBanner />
    </div>
  )
}

export default HomeScreen