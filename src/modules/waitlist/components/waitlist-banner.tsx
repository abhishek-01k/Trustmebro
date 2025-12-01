import React from 'react'
import { Button } from '@/components/ui/button'
import { useWaitlistStatus, useJoinWaitlist } from '@/queries/waitlist'
import { usePrivy } from '@privy-io/react-auth'
import WaitlistBannerSkeleton from './waitlist-banner-skeleton'

const WaitlistBanner = () => {
  const { user } = usePrivy()
  const { data: waitlistStatus, isLoading } = useWaitlistStatus()
  const joinWaitlist = useJoinWaitlist()

  const handleJoinWaitlist = async () => {
    if (!user?.farcaster?.fid) {
      return
    }

    joinWaitlist.mutate({
      farcasterFid: user.farcaster.fid,
      username: user.farcaster.username || '',
      displayName: user.farcaster.displayName || undefined,
      avatar: user.farcaster.pfp || undefined,
      walletAddress: user.wallet?.address || undefined,
    })
  }

  const isOnWaitlist = waitlistStatus?.onWaitlist ?? false
  const isLoadingState = isLoading || joinWaitlist.isPending

  if (isLoading) {
    return <WaitlistBannerSkeleton />
  }

  return (
    <div className="bg-[#0b0a0a]/50 rounded-2xl p-6 max-w-md w-full shadow-lg">
      <div className="flex flex-col items-center space-y-4">
        {isOnWaitlist && waitlistStatus ? (
          <div className="text-center space-y-2">
            <p className="text-white text-lg font-game-of-squids">
              You&apos;re on the waitlist! 🎉
            </p>
            {waitlistStatus.position && (
              <p className="text-white/80 text-sm">
                Position: #{waitlistStatus.position} of {waitlistStatus.totalSignups}
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="text-white text-lg font-game-of-squids text-center">
              Join the waitlist for early access
            </p>
            <Button
              onClick={handleJoinWaitlist}
              disabled={isLoadingState || !user?.farcaster}
              className="text-xl w-full h-12 rounded-full font-game-of-squids bg-gradient-to-b from-[#a9062c] to-[#4e1624] hover:from-[#8d0524] hover:to-[#3d1119] text-white font-semibold uppercase tracking-wide shadow-lg transition-all"
            >
              {isLoadingState ? 'Joining...' : 'Join Waitlist'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default WaitlistBanner

