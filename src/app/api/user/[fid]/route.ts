import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  try {
    const { fid } = await params;
    const farcasterFid = parseInt(fid, 10);

    if (isNaN(farcasterFid)) {
      return NextResponse.json(
        { error: "Invalid farcaster FID" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { farcasterFid },
      include: {
        games: {
          orderBy: { playedAt: "desc" },
          take: 5,
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate stats
    const [gamesStats, transactionStats] = await Promise.all([
      prisma.game.aggregate({
        where: { userId: user.id },
        _count: { id: true },
        _sum: { profitLoss: true },
      }),
      prisma.transaction.count({
        where: { userId: user.id },
      }),
    ]);

    // Calculate win rate
    const winCount = await prisma.game.count({
      where: { userId: user.id, result: "WIN" },
    });

    const gamesPlayed = gamesStats._count.id;
    const winRate = gamesPlayed > 0 ? (winCount / gamesPlayed) * 100 : 0;

    return NextResponse.json({
      user: {
        id: user.id,
        farcasterFid: user.farcasterFid,
        username: user.username,
        avatar: user.avatar,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt,
      },
      stats: {
        gamesPlayed,
        profitLoss: gamesStats._sum.profitLoss?.toNumber() ?? 0,
        totalTransactions: transactionStats,
        winRate: Math.round(winRate * 100) / 100,
      },
      recentGames: user.games.map((game) => ({
        ...game,
        profitLoss: game.profitLoss.toNumber(),
      })),
      recentTransactions: user.transactions.map((tx) => ({
        ...tx,
        amount: tx.amount.toNumber(),
      })),
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
