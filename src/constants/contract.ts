export const MIN_BET_AMOUNT = 0.1;
export const MAX_BET_AMOUNT = 5;

export const GAME_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GAME_CONTRACT_ADDRESS as `0x${string}` | undefined;
export const GAME_CHAIN_ID = Number(process.env.NEXT_PUBLIC_GAME_CHAIN_ID) || 8453;
export const USDC_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS as `0x${string}`;
export const USDC_DECIMALS = 6;

export const USDC_ABI = [
    { inputs: [], stateMutability: "nonpayable", type: "constructor" },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "allowance", type: "uint256" },
        { internalType: "uint256", name: "needed", type: "uint256" },
      ],
      name: "ERC20InsufficientAllowance",
      type: "error",
    },
    {
      inputs: [
        { internalType: "address", name: "sender", type: "address" },
        { internalType: "uint256", name: "balance", type: "uint256" },
        { internalType: "uint256", name: "needed", type: "uint256" },
      ],
      name: "ERC20InsufficientBalance",
      type: "error",
    },
    {
      inputs: [{ internalType: "address", name: "approver", type: "address" }],
      name: "ERC20InvalidApprover",
      type: "error",
    },
    {
      inputs: [{ internalType: "address", name: "receiver", type: "address" }],
      name: "ERC20InvalidReceiver",
      type: "error",
    },
    {
      inputs: [{ internalType: "address", name: "sender", type: "address" }],
      name: "ERC20InvalidSender",
      type: "error",
    },
    {
      inputs: [{ internalType: "address", name: "spender", type: "address" }],
      name: "ERC20InvalidSpender",
      type: "error",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Approval",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "from", type: "address" },
        { indexed: true, internalType: "address", name: "to", type: "address" },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      inputs: [
        { internalType: "address", name: "owner", type: "address" },
        { internalType: "address", name: "spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "mint",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalSupply",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "from", type: "address" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
      ],
      name: "transferFrom",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ] as const;
  
  export const GAME_CONTRACT_ABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_token",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "bet",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "maxBet",
          "type": "uint256"
        }
      ],
      "name": "BetExceedsMaxBet",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "gameId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "payoutAmount",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "seed",
          "type": "bytes32"
        }
      ],
      "name": "cashOut",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "preliminaryId",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "commitmentHash",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "betAmount",
          "type": "uint256"
        }
      ],
      "name": "createGame",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "onChainGameId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "EnforcedPause",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ExpectedPause",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "gameId",
          "type": "uint256"
        },
        {
          "internalType": "enum MultiplierGame.Status",
          "name": "currentStatus",
          "type": "uint8"
        }
      ],
      "name": "GameNotInCreatedStatus",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "requested",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "available",
          "type": "uint256"
        }
      ],
      "name": "InsufficientFees",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "requested",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "available",
          "type": "uint256"
        }
      ],
      "name": "InsufficientPot",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "provided",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "expected",
          "type": "bytes32"
        }
      ],
      "name": "InvalidReveal",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidTokenAddress",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "gameId",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "seed",
          "type": "bytes32"
        }
      ],
      "name": "markGameAsLost",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "caller",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        }
      ],
      "name": "NotGamePlayer",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "payout",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "maxPayout",
          "type": "uint256"
        }
      ],
      "name": "PayoutExceedsMaxPayout",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "TransferFailed",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "caller",
          "type": "address"
        }
      ],
      "name": "UnauthorizedBackend",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ZeroBet",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "backend",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "authorized",
          "type": "bool"
        }
      ],
      "name": "BackendAuthorizationChanged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "FeesWithdrawn",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "preliminaryGameId",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "onChainGameId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "betAmount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "commitmentHash",
          "type": "bytes32"
        }
      ],
      "name": "GameCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "onChainGameId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "enum MultiplierGame.Status",
          "name": "status",
          "type": "uint8"
        }
      ],
      "name": "GameStatusUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "pause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "Paused",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "onChainGameId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        }
      ],
      "name": "PayoutSent",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "funder",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "PotRefilled",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "refillPot",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "backend",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "authorized",
          "type": "bool"
        }
      ],
      "name": "setBackend",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "unpause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "Unpaused",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "withdrawFees",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "authorizedBackends",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "games",
      "outputs": [
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "betAmount",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "commitmentHash",
          "type": "bytes32"
        },
        {
          "internalType": "enum MultiplierGame.Status",
          "name": "status",
          "type": "uint8"
        },
        {
          "internalType": "bytes32",
          "name": "preliminaryGameId",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "createdAt",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "seed",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "gameId",
          "type": "uint256"
        }
      ],
      "name": "getGame",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "player",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "betAmount",
              "type": "uint256"
            },
            {
              "internalType": "bytes32",
              "name": "commitmentHash",
              "type": "bytes32"
            },
            {
              "internalType": "enum MultiplierGame.Status",
              "name": "status",
              "type": "uint8"
            },
            {
              "internalType": "bytes32",
              "name": "preliminaryGameId",
              "type": "bytes32"
            },
            {
              "internalType": "uint256",
              "name": "createdAt",
              "type": "uint256"
            },
            {
              "internalType": "bytes32",
              "name": "seed",
              "type": "bytes32"
            }
          ],
          "internalType": "struct MultiplierGame.Game",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getMaxBet",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getMaxPayout",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getPotBalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "HOUSE_EDGE_BPS",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MAX_BET_BPS",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MAX_PAYOUT_BPS",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextOnChainGameId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "ownerFees",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "paused",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "token",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];