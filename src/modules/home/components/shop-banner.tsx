import React from 'react'
import { Button } from '@/src/components/ui/button'

const ShopBanner = () => {
  return (
    <div className="bg-[#0b0a0a]/50 rounded-2xl p-6 max-w-md w-full shadow-lg">
      <div className="space-y-6">
        <div className="text-gray-400 text-center space-y-2">
          <p className="text-lg leading-relaxed">
          Bet, Pick and win based on your luck! It&apos;s either Jackpot or Death!!
          </p>
        </div>
        <div className="flex justify-center">
          <Button
            className="w-full h-12 rounded-full bg-gradient-to-b from-[#a9062c] to-[#4e1624] hover:from-[#8d0524] hover:to-[#3d1119] text-white font-semibold uppercase tracking-wide shadow-lg transition-all"
          >
            Start Game
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ShopBanner

