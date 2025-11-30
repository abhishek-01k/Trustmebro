import { createPublicClient, createWalletClient, http, type Address, type Hash } from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { anvil } from "viem/chains";
import { keccak256, encodePacked } from "viem";
import { loadContractABI, getDeployedAddress } from "../utils/contract-utils";

export enum GameStatus {
  CREATED = 0,
  CASHED_OUT = 1,
  LOST = 2,
}

export interface Game {
  player: Address;
  betAmount: bigint;
  commitmentHash: Hash;
  status: GameStatus;
  preliminaryGameId: Hash;
  createdAt: bigint;
}

export class MultiplierGameClient {
  private publicClient;
  private walletClient;
  private contractAddress: Address;
  private abi;

  constructor(
    rpcUrl: string = "http://localhost:8545",
    account?: PrivateKeyAccount
  ) {
    this.contractAddress = getDeployedAddress() as Address;
    this.abi = loadContractABI();

    this.publicClient = createPublicClient({
      chain: anvil,
      transport: http(rpcUrl),
    });

    if (account) {
      this.walletClient = createWalletClient({
        account,
        chain: anvil,
        transport: http(rpcUrl),
      });
    }
  }

  /**
   * Create a commitment hash from seed and payout amount
   */
  static createCommitment(seed: Hash, payoutAmount: bigint): Hash {
    return keccak256(encodePacked(["bytes32", "uint256"], [seed, payoutAmount]));
  }

  /**
   * Create a game with a bet
   */
  async createGame(
    preliminaryId: Hash,
    commitmentHash: Hash,
    betAmount: bigint
  ): Promise<{ gameId: bigint; txHash: Hash }> {
    if (!this.walletClient) {
      throw new Error("Wallet client not initialized. Provide an account in constructor.");
    }

    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName: "createGame",
      args: [preliminaryId, commitmentHash],
      value: betAmount,
      chain: anvil,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    // Extract game ID from event logs
    // GameCreated event signature: GameCreated(bytes32,uint256 indexed,address indexed,uint256,bytes32)
    // topics[0] = event signature hash
    // topics[1] = onChainGameId (indexed uint256)
    // topics[2] = player (indexed address)
    
    const gameCreatedEvent = receipt.logs.find((log) => {
      // Check if this log is from our contract
      return log.address.toLowerCase() === this.contractAddress.toLowerCase();
    });

    if (!gameCreatedEvent || !gameCreatedEvent.topics[1]) {
      throw new Error("GameCreated event not found in receipt");
    }

    // topics[1] is the indexed onChainGameId
    const gameId = BigInt(gameCreatedEvent.topics[1]);

    return { gameId, txHash: hash };
  }

  /**
   * Cash out a game
   */
  async cashOut(
    gameId: bigint,
    payoutAmount: bigint,
    seed: Hash
  ): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error("Wallet client not initialized. Provide an account in constructor.");
    }

    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName: "cashOut",
      args: [gameId, payoutAmount, seed],
      chain: anvil,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  /**
   * Mark a game as lost (backend only)
   */
  async markGameAsLost(gameId: bigint): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error("Wallet client not initialized. Provide an account in constructor.");
    }

    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName: "markGameAsLost",
      args: [gameId],
      chain: anvil,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  /**
   * Get game details
   */
  async getGame(gameId: bigint): Promise<Game> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName: "getGame",
      args: [gameId],
    }) as any;

    // viem returns structs as objects with named properties
    // The struct has fields: player, betAmount, commitmentHash, status, preliminaryGameId, createdAt
    if (result && typeof result === 'object') {
      // Check if it's an array-like structure (tuple)
      if (Array.isArray(result)) {
        return {
          player: result[0] as Address,
          betAmount: result[1] as bigint,
          commitmentHash: result[2] as Hash,
          status: result[3] as GameStatus,
          preliminaryGameId: result[4] as Hash,
          createdAt: result[5] as bigint,
        };
      } else if (result.player !== undefined) {
        // Object with named properties
        return {
          player: result.player as Address,
          betAmount: result.betAmount as bigint,
          commitmentHash: result.commitmentHash as Hash,
          status: result.status as GameStatus,
          preliminaryGameId: result.preliminaryGameId as Hash,
          createdAt: result.createdAt as bigint,
        };
      }
    }
    
    throw new Error(`Invalid game data returned for gameId ${gameId}: ${JSON.stringify(result)}`);
  }

  /**
   * Get pot balance
   */
  async getPotBalance(): Promise<bigint> {
    return await this.publicClient.readContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName: "getPotBalance",
    });
  }

  /**
   * Get maximum bet
   */
  async getMaxBet(): Promise<bigint> {
    return await this.publicClient.readContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName: "getMaxBet",
    });
  }

  /**
   * Get maximum payout
   */
  async getMaxPayout(): Promise<bigint> {
    return await this.publicClient.readContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName: "getMaxPayout",
    });
  }

  /**
   * Get owner address
   */
  async getOwner(): Promise<Address> {
    return await this.publicClient.readContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName: "owner",
    });
  }

  /**
   * Get owner fees
   */
  async getOwnerFees(): Promise<bigint> {
    return await this.publicClient.readContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName: "ownerFees",
    });
  }

  /**
   * Check if backend is authorized
   */
  async isBackendAuthorized(backend: Address): Promise<boolean> {
    return await this.publicClient.readContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName: "authorizedBackends",
      args: [backend],
    });
  }

  /**
   * Set backend authorization (owner only)
   */
  async setBackend(backend: Address, authorized: boolean): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error("Wallet client not initialized. Provide an account in constructor.");
    }

    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName: "setBackend",
      args: [backend, authorized],
      chain: anvil,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  /**
   * Pause contract (owner only)
   */
  async pause(): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error("Wallet client not initialized. Provide an account in constructor.");
    }

    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName: "pause",
      chain: anvil,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  /**
   * Unpause contract (owner only)
   */
  async unpause(): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error("Wallet client not initialized. Provide an account in constructor.");
    }

    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName: "unpause",
      chain: anvil,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  /**
   * Refill pot (owner only)
   */
  async refillPot(amount: bigint): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error("Wallet client not initialized. Provide an account in constructor.");
    }

    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName: "refillPot",
      value: amount,
      chain: anvil,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  /**
   * Withdraw fees (owner only)
   */
  async withdrawFees(amount: bigint): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error("Wallet client not initialized. Provide an account in constructor.");
    }

    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName: "withdrawFees",
      args: [amount],
      chain: anvil,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  /**
   * Get contract address
   */
  getAddress(): Address {
    return this.contractAddress;
  }
}

