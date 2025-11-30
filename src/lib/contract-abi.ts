/**
 * MultiplierGame Contract ABI
 * Extracted from contracts/src/MultiplierGame.sol
 */
export const MULTIPLIER_GAME_ABI = [
  // Read functions
  {
    inputs: [{ name: 'gameId', type: 'uint256' }],
    name: 'getGame',
    outputs: [
      {
        components: [
          { name: 'player', type: 'address' },
          { name: 'betAmount', type: 'uint256' },
          { name: 'commitmentHash', type: 'bytes32' },
          { name: 'status', type: 'uint8' },
          { name: 'preliminaryGameId', type: 'bytes32' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'seed', type: 'bytes32' },
        ],
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPotBalance',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getMaxBet',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getMaxPayout',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ownerFees',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextOnChainGameId',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'authorizedBackends',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },

  // Write functions (player)
  {
    inputs: [
      { name: 'preliminaryId', type: 'bytes32' },
      { name: 'commitmentHash', type: 'bytes32' },
      { name: 'betAmount', type: 'uint256' },
    ],
    name: 'createGame',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // Write functions (backend only)
  {
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'payoutAmount', type: 'uint256' },
      { name: 'seed', type: 'bytes32' },
    ],
    name: 'cashOut',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'seed', type: 'bytes32' },
    ],
    name: 'markGameAsLost',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // Owner functions
  {
    inputs: [
      { name: 'backend', type: 'address' },
      { name: 'authorized', type: 'bool' },
    ],
    name: 'setBackend',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'refillPot',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'withdrawFees',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: 'preliminaryGameId', type: 'bytes32' },
      { indexed: true, name: 'onChainGameId', type: 'uint256' },
      { indexed: true, name: 'player', type: 'address' },
      { indexed: false, name: 'betAmount', type: 'uint256' },
      { indexed: false, name: 'commitmentHash', type: 'bytes32' },
    ],
    name: 'GameCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'onChainGameId', type: 'uint256' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: true, name: 'recipient', type: 'address' },
    ],
    name: 'PayoutSent',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'onChainGameId', type: 'uint256' },
      { indexed: false, name: 'status', type: 'uint8' },
    ],
    name: 'GameStatusUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'backend', type: 'address' },
      { indexed: false, name: 'authorized', type: 'bool' },
    ],
    name: 'BackendAuthorizationChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'funder', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'PotRefilled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'FeesWithdrawn',
    type: 'event',
  },
] as const;

/**
 * Game status enum matching contract
 */
export enum OnChainGameStatus {
  CREATED = 0,
  CASHED_OUT = 1,
  LOST = 2,
}

/**
 * On-chain game data structure
 */
export interface OnChainGame {
  player: `0x${string}`;
  betAmount: bigint;
  commitmentHash: `0x${string}`;
  status: OnChainGameStatus;
  preliminaryGameId: `0x${string}`;
  createdAt: bigint;
  seed: `0x${string}`;
}

/**
 * Contract state data
 */
export interface ContractStateData {
  potBalance: bigint;
  maxBet: bigint;
  maxPayout: bigint;
  isPaused: boolean;
  tokenAddress: `0x${string}`;
}
