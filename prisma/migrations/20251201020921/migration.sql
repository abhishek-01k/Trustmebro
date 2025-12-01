-- CreateEnum
CREATE TYPE "GameSessionStatus" AS ENUM ('PENDING_CHAIN', 'ACTIVE', 'CASHING_OUT', 'MARKING_LOST', 'COMPLETED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "GameResult" AS ENUM ('WIN', 'LOSS', 'DRAW');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'GAME_ENTRY', 'GAME_PAYOUT', 'GAME_BET');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "farcasterFid" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "avatar" TEXT,
    "walletAddress" TEXT,
    "totalGamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "totalWagered" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "totalWon" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "totalLost" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "biggestWin" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "biggestMultiplier" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preliminaryGameId" TEXT NOT NULL,
    "onChainGameId" BIGINT,
    "betAmount" DECIMAL(78,0) NOT NULL,
    "seed" TEXT NOT NULL,
    "commitmentHash" TEXT NOT NULL,
    "gameConfig" JSONB NOT NULL,
    "gameMode" TEXT NOT NULL DEFAULT 'MEDIUM',
    "currentRow" INTEGER NOT NULL DEFAULT 0,
    "currentMultiplier" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "potentialPayout" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "status" "GameSessionStatus" NOT NULL DEFAULT 'PENDING_CHAIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chainConfirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createTxHash" TEXT,
    "finalizeTxHash" TEXT,
    "finalGameId" TEXT,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "onChainGameId" BIGINT,
    "preliminaryGameId" TEXT,
    "betAmount" DECIMAL(78,0) NOT NULL,
    "payoutAmount" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "profitLoss" DECIMAL(78,0) NOT NULL,
    "result" "GameResult" NOT NULL,
    "finalMultiplier" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "rowsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "seed" TEXT,
    "gameConfig" JSONB,
    "gameMode" TEXT NOT NULL DEFAULT 'MEDIUM',
    "gameType" TEXT NOT NULL DEFAULT 'multiplier',
    "createTxHash" TEXT,
    "finalizeTxHash" TEXT,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(78,0) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "txHash" TEXT,
    "blockNumber" BIGINT,
    "gameId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractState" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "potBalance" DECIMAL(78,0) NOT NULL,
    "maxBet" DECIMAL(78,0) NOT NULL,
    "maxPayout" DECIMAL(78,0) NOT NULL,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "contractAddress" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "lastSyncedBlock" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL,
    "farcasterFid" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "avatar" TEXT,
    "walletAddress" TEXT,
    "referredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_farcasterFid_key" ON "User"("farcasterFid");

-- CreateIndex
CREATE INDEX "User_farcasterFid_idx" ON "User"("farcasterFid");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_preliminaryGameId_key" ON "GameSession"("preliminaryGameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_onChainGameId_key" ON "GameSession"("onChainGameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_finalGameId_key" ON "GameSession"("finalGameId");

-- CreateIndex
CREATE INDEX "GameSession_userId_idx" ON "GameSession"("userId");

-- CreateIndex
CREATE INDEX "GameSession_status_idx" ON "GameSession"("status");

-- CreateIndex
CREATE INDEX "GameSession_onChainGameId_idx" ON "GameSession"("onChainGameId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_onChainGameId_key" ON "Game"("onChainGameId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_preliminaryGameId_key" ON "Game"("preliminaryGameId");

-- CreateIndex
CREATE INDEX "Game_userId_idx" ON "Game"("userId");

-- CreateIndex
CREATE INDEX "Game_result_idx" ON "Game"("result");

-- CreateIndex
CREATE INDEX "Game_playedAt_idx" ON "Game"("playedAt");

-- CreateIndex
CREATE INDEX "Game_userId_playedAt_idx" ON "Game"("userId", "playedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_txHash_key" ON "Transaction"("txHash");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_gameId_idx" ON "Transaction"("gameId");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_txHash_idx" ON "Transaction"("txHash");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_farcasterFid_key" ON "Waitlist"("farcasterFid");

-- CreateIndex
CREATE INDEX "Waitlist_farcasterFid_idx" ON "Waitlist"("farcasterFid");

-- CreateIndex
CREATE INDEX "Waitlist_createdAt_idx" ON "Waitlist"("createdAt");

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_finalGameId_fkey" FOREIGN KEY ("finalGameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
