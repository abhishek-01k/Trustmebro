import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const WaitlistBannerSkeleton = () => {
  return (
    <div className="bg-[#0b0a0a]/50 rounded-2xl p-6 max-w-md w-full shadow-lg">
      <div className="flex flex-col items-center space-y-4">
        <Skeleton className="h-6 w-64 bg-white/20" />
        <Skeleton className="h-12 w-full rounded-full bg-white/20" />
      </div>
    </div>
  )
}

export default WaitlistBannerSkeleton

