import { createConfig } from '@privy-io/wagmi'
import { http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { GAME_CHAIN_ID } from '@/constants/contract'

const selectedChain = GAME_CHAIN_ID === 84532 ? baseSepolia : base

export const wagmiConfig = createConfig({
  chains: [selectedChain],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
})