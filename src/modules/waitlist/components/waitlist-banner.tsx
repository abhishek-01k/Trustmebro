import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useWaitlistStatus, useJoinWaitlist } from '@/queries/waitlist'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { sdk } from '@farcaster/miniapp-sdk'
import WaitlistBannerSkeleton from './waitlist-banner-skeleton'
import { useReadContract } from 'wagmi'
import { NFT_CONTRACT_ADDRESS, TRUST_ME_BRO_NFT_ABI } from '@/constants'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

const WaitlistBanner = () => {
  const { user } = usePrivy()
  const { data: waitlistStatus, isLoading, refetch: refetchWaitlistStatus } = useWaitlistStatus()
  const { wallets } = useWallets();
  const joinWaitlist = useJoinWaitlist()
  const [isMintingNFT, setIsMintingNFT] = useState(false)
  const [mintError, setMintError] = useState<string | null>(null)

  // Check if user already has an NFT
  const { data: hasNft } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: TRUST_ME_BRO_NFT_ABI,
    functionName: 'hasNft',
    args: wallets[0]?.address ? [wallets[0]?.address as `0x${string}`] : undefined,
    query: {
      enabled: !!wallets[0]?.address && !!NFT_CONTRACT_ADDRESS,
    },
  })

  const handleJoinWaitlist = async () => {
    if (!user?.farcaster?.fid || !wallets[0]?.address) {
      return
    }

    // Prevent duplicate mints
    if (hasNft) {
      setMintError('You already have a Trust Me Bro NFT')
      return
    }

    try {
      setIsMintingNFT(true)
      setMintError(null)

      if (!NFT_CONTRACT_ADDRESS) {
        throw new Error('NFT contract address not configured')
      }

      const wallet = wallets[0]
      if (!wallet) {
        throw new Error('No wallet available')
      }

      // Switch to Base chain if needed
      await wallet.switchChain(base.id)

      // Get the wallet provider directly from Privy
      const provider = await wallet.getEthereumProvider()

      // Send mint transaction
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: wallet.address as `0x${string}`,
          to: NFT_CONTRACT_ADDRESS,
          data: '0x1249c58b', // mint() function selector
        }],
      }) as `0x${string}`

      // Create public client to wait for receipt
      const publicClient = createPublicClient({
        chain: base,
        transport: http(),
      })

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
      })

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed')
      }

      // Transaction succeeded - NFT was minted, join waitlist
      await new Promise<void>((resolve, reject) => {
        joinWaitlist.mutate(
          {
            farcasterFid: user.farcaster!.fid!,
            username: user.farcaster!.username || '',
            displayName: user.farcaster!.displayName || undefined,
            avatar: user.farcaster!.pfp || undefined,
            walletAddress: wallets[0]?.address || undefined,
          },
          {
            onSuccess: () => resolve(),
            onError: reject,
          }
        )
      })

      // Refresh waitlist status
      await refetchWaitlistStatus()
    } catch (err) {
      console.error('Error minting NFT:', err)
      setMintError(err instanceof Error ? err.message : 'Failed to mint NFT')
    } finally {
      setIsMintingNFT(false)
    }
  }

  // Unused function - removed to fix linting
  // const castHandler = async () => {
  //   if (!waitlistStatus?.position) {
  //     return
  //   }
  //   try {
  //     const sharePageUrl = `https://trustmebro-tan.vercel.app/waitlist/share?pos=${waitlistStatus.position}`;
  //     const castText = `🔴 Just minted my Early Access Pass for TrustMeBro!\n\nPosition #${waitlistStatus.position} of ${waitlistStatus.totalSignups} degens.`;
  //     await sdk.actions.composeCast({
  //       text: castText,
  //       embeds: [sharePageUrl],
  //     });
  //   } catch {
  //     console.error("Failed to cast to Farcaster");
  //   }
  // }

  const isOnWaitlist = waitlistStatus?.onWaitlist ?? false
  const isLoadingState = isLoading || joinWaitlist.isPending || isMintingNFT

  if (isLoading) {
    return <WaitlistBannerSkeleton />
  }

  return (
    <div className="bg-[#0b0a0a]/50 rounded-2xl p-6 max-w-md w-full shadow-lg">
      <div className="flex flex-col items-center space-y-4">
        {isOnWaitlist && waitlistStatus ? (
          <div className="text-center space-y-4">
            <p className="text-white text-lg font-game-of-squids">
              You&apos;re on the waitlist! 🎉
            </p>
            {waitlistStatus.position && (
              <p className="text-white/80 text-sm">
                Position: #{waitlistStatus.position} of {waitlistStatus.totalSignups}
              </p>
            )}
            {waitlistStatus.share && (
              <Button
                onClick={async () => {
                  try {
                    await sdk.actions.composeCast({
                      text: waitlistStatus.share!.castText,
                      embeds: [waitlistStatus.share!.frameUrl, waitlistStatus.share!.miniAppUrl],
                    })
                  } catch (error) {
                    // Fallback to URL redirect if SDK fails
                    window.open(waitlistStatus.share!.castIntent, '_blank')
                  }
                }}
                className="text-lg w-full h-12 rounded-full font-game-of-squids bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold uppercase tracking-wide shadow-lg transition-all"
              >
                Share
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-white text-lg font-game-of-squids text-center">
              Join the waitlist & mint your pass
            </p>
            <p className="text-white/60 text-xs text-center">
              Free NFT mint - you only pay gas fees
            </p>
            {mintError && (
              <p className="text-red-400 text-xs text-center">
                {mintError}
              </p>
            )}
            <Button
              onClick={handleJoinWaitlist}
              disabled={isLoadingState || !user?.farcaster || !wallets[0]?.address}
              className="text-xl w-full h-12 rounded-full font-game-of-squids bg-gradient-to-b from-[#a9062c] to-[#4e1624] hover:from-[#8d0524] hover:to-[#3d1119] text-white font-semibold uppercase tracking-wide shadow-lg transition-all disabled:opacity-50"
            >
              {isMintingNFT ? 'Minting NFT...' : isLoadingState ? 'Joining...' : 'Join & Mint NFT'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default WaitlistBanner

