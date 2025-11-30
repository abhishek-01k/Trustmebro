import {
  createPublicClient,
  createWalletClient,
  http,
  type Hash,
  type Address,
  type Log,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { v4 as uuidv4 } from 'uuid';
import {
  MULTIPLIER_GAME_ABI,
  OnChainGameStatus,
  type OnChainGame,
  type ContractStateData,
} from './contract-abi';

// Re-export types
export { OnChainGameStatus, type OnChainGame, type ContractStateData };

/**
 * Generate a unique preliminary game ID (bytes32)
 * Used to link off-chain session with on-chain game
 */
export function generatePreliminaryGameId(): `0x${string}` {
  const uuid = uuidv4().replace(/-/g, '');
  // Pad to 64 chars (32 bytes)
  return `0x${uuid.padEnd(64, '0')}` as `0x${string}`;
}

/**
 * Contract client for interacting with MultiplierGame contract
 */
export class ContractClient {
  public readonly contractAddress: Address;
  private readonly publicClient: ReturnType<typeof createPublicClient>;
  private readonly walletClient: ReturnType<typeof createWalletClient>;

  constructor(
    rpcUrl: string = process.env.RPC_URL || 'http://localhost:8545',
    contractAddress: Address = process.env.CONTRACT_ADDRESS as Address,
    backendPrivateKey: Hash = process.env.BACKEND_PRIVATE_KEY as Hash
  ) {
    this.contractAddress = contractAddress;

    // @ts-expect-error - viem type compatibility issue with baseSepolia chain
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    const account = privateKeyToAccount(backendPrivateKey);
    this.walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(rpcUrl),
    });
  }

  /**
   * Get current contract state (pot balance, limits, pause status)
   */
  async getContractState(): Promise<ContractStateData> {
    const [potBalance, maxBet, maxPayout, isPaused, tokenAddress] = await Promise.all([
      this.publicClient.readContract({
        address: this.contractAddress,
        abi: MULTIPLIER_GAME_ABI,
        functionName: 'getPotBalance',
      }) as Promise<bigint>,
      this.publicClient.readContract({
        address: this.contractAddress,
        abi: MULTIPLIER_GAME_ABI,
        functionName: 'getMaxBet',
      }) as Promise<bigint>,
      this.publicClient.readContract({
        address: this.contractAddress,
        abi: MULTIPLIER_GAME_ABI,
        functionName: 'getMaxPayout',
      }) as Promise<bigint>,
      this.publicClient.readContract({
        address: this.contractAddress,
        abi: MULTIPLIER_GAME_ABI,
        functionName: 'paused',
      }) as Promise<boolean>,
      this.publicClient.readContract({
        address: this.contractAddress,
        abi: MULTIPLIER_GAME_ABI,
        functionName: 'token',
      }) as Promise<`0x${string}`>,
    ]);

    return { potBalance, maxBet, maxPayout, isPaused, tokenAddress };
  }

  /**
   * Get game data from contract
   */
  async getGame(gameId: bigint): Promise<OnChainGame> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: MULTIPLIER_GAME_ABI,
      functionName: 'getGame',
      args: [gameId],
    });

    // Type assertion for the tuple result
    const game = result as unknown as readonly [
      `0x${string}`, // player
      bigint, // betAmount
      `0x${string}`, // commitmentHash
      number, // status
      `0x${string}`, // preliminaryGameId
      bigint, // createdAt
      `0x${string}` // seed
    ];

    return {
      player: game[0],
      betAmount: game[1],
      commitmentHash: game[2],
      status: game[3] as OnChainGameStatus,
      preliminaryGameId: game[4],
      createdAt: game[5],
      seed: game[6],
    };
  }

  /**
   * Cash out a game (backend only)
   * @param gameId - On-chain game ID
   * @param payoutAmount - Amount to pay player (before house edge deduction by contract)
   * @param seed - The revealed game seed
   * @returns Transaction hash
   */
  async cashOut(gameId: bigint, payoutAmount: bigint, seed: Hash): Promise<Hash> {
    // @ts-expect-error - viem type compatibility issue with baseSepolia chain
    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: MULTIPLIER_GAME_ABI,
      functionName: 'cashOut',
      args: [gameId, payoutAmount, seed],
      chain: baseSepolia,
    });

    // Wait for confirmation
    await this.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  /**
   * Mark a game as lost (backend only)
   * @param gameId - On-chain game ID
   * @param seed - The revealed game seed
   * @returns Transaction hash
   */
  async markGameAsLost(gameId: bigint, seed: Hash): Promise<Hash> {
    // @ts-expect-error - viem type compatibility issue with baseSepolia chain
    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: MULTIPLIER_GAME_ABI,
      functionName: 'markGameAsLost',
      args: [gameId, seed],
      chain: baseSepolia,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  /**
   * Verify a transaction receipt
   */
  async verifyTransaction(txHash: Hash) {
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    return {
      success: receipt.status === 'success',
      blockNumber: receipt.blockNumber,
      logs: receipt.logs,
    };
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<bigint> {
    return this.publicClient.getBlockNumber();
  }

  /**
   * Watch for GameCreated events
   */
  watchGameCreated(callback: (log: Log) => void): () => void {
    return this.publicClient.watchContractEvent({
      address: this.contractAddress,
      abi: MULTIPLIER_GAME_ABI,
      eventName: 'GameCreated',
      onLogs: (logs) => logs.forEach(callback),
    });
  }

  /**
   * Watch for GameStatusUpdated events
   */
  watchGameStatusUpdated(callback: (log: Log) => void): () => void {
    return this.publicClient.watchContractEvent({
      address: this.contractAddress,
      abi: MULTIPLIER_GAME_ABI,
      eventName: 'GameStatusUpdated',
      onLogs: (logs) => logs.forEach(callback),
    });
  }

  /**
   * Watch for PayoutSent events
   */
  watchPayoutSent(callback: (log: Log) => void): () => void {
    return this.publicClient.watchContractEvent({
      address: this.contractAddress,
      abi: MULTIPLIER_GAME_ABI,
      eventName: 'PayoutSent',
      onLogs: (logs) => logs.forEach(callback),
    });
  }
}

// Singleton instance
let contractClientInstance: ContractClient | null = null;

/**
 * Get singleton contract client instance
 */
export function getContractClient(): ContractClient {
  if (!contractClientInstance) {
    contractClientInstance = new ContractClient();
  }
  return contractClientInstance;
}

/**
 * Reset contract client (useful for reinitializing with new config)
 */
export function resetContractClient(): void {
  contractClientInstance = null;
}
