import { Button } from '@/src/components/ui/button'
import React from 'react'

interface GameCashOutProps {
  betAmount: number;
}

const GameCashOut = ({ betAmount }: GameCashOutProps) => {
  return (
    <div className='flex flex-col items-center justify-center py-4 gap-2'>
        <div>
            <p className='text-white/70 text-sm'>Bet: <span className='text-white font-semibold'>$ {betAmount.toFixed(2)}</span></p>
        </div>
        <div>
            <Button className='bg-[#ed1b76] hover:bg-[#d11766] text-white font-semibold px-8 py-6 text-lg'>
                Cash Out
            </Button>
        </div>
    </div>
  )
}

export default GameCashOut