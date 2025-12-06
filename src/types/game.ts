export interface CreateGamePayload {
    betAmount: string;
    tilesPerRound: number[];
  }
  
  export type GameMode = "EASY" | "MEDIUM" | "HARD" | "EXTREME";
  
  export interface CreateGameResponse {
    sessionId: string;
    preliminaryGameId: string;
    commitmentHash: string;
    betAmount: string;
    rowConfigs: unknown;
    estimatedMultipliers: number[];
    maxMultiplier: number;
    maxPayout: string;
    contractAddress: string;
  }
  
  export interface ConfirmGameCreationPayload {
    sessionId: string;
    txHash: string;
    onChainGameId: string | number;
  }
  
  export interface ConfirmGameCreationResponse {
    sessionId: string;
    status: string;
    currentRow: number;
    currentMultiplier: number;
    onChainGameId?: string;
  }
  
  export interface CashOutPayload {
    sessionId: string;
  }
  
  export interface CashOutResponse {
    sessionId: string;
    gameId: string;
    status: "COMPLETED";
    result: "WIN" | "LOSS";
    payoutAmount: string;
    playerReceives: string;
    profitLoss: string;
    finalMultiplier: number;
    rowsCompleted: number;
    totalRows: number;
    betAmount: string;
    txHash: string;
    seed: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gameConfig: any;
  }
  
  export interface ActiveGameResponse {
    sessionId: string;
    status: string;
    betAmount: string;
    gameMode: string;
    currentRow: number;
    currentMultiplier: number;
    potentialPayout: string;
    rowConfigs: Array<{ tiles: number; deathTiles: number }>;
    multipliers: number[];
    totalRows: number;
    canCashOut: boolean;
    onChainGameId: string | null;
    preliminaryGameId: string | null;
    commitmentHash: string | null;
    currentRowConfig: { tiles: number; deathTiles: number } | null;
    createdAt: string;
  }

  export interface SelectTilePayload {
    sessionId: string;
    tileIndex: number;
  }

  export interface SelectTileResponse {
    result: "SAFE" | "DEATH";
    currentRow?: number;
    currentMultiplier?: number;
    potentialPayout?: string;
    canCashOut?: boolean;
    isLastRow?: boolean;
    nextRowConfig?: { tiles: number; deathTiles: number };
    deathTileIndex?: number;
    finalMultiplier?: number;
    gameOver?: boolean;
    seed?: string;
    gameId?: string;
    rowsCompleted?: number;
    totalRows?: number;
    betAmount?: string;
    txHash?: string | null;
    gameConfig?: unknown;
  }
  