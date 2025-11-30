import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface LeaderboardEntry {
  rank: number;
  fid: number;
  username: string;
  pfp: string | null;
  pnl: number;
}

interface GameWithProfitLoss {
  profitLoss: { toString(): string };
}

interface UserWithGames {
  id: string;
  farcasterFid: number;
  username: string;
  avatar: string | null;
  games: GameWithProfitLoss[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const currentUserFid = searchParams.get("fid"); // Optional: current user's FID to get their rank
    const skip = (page - 1) * limit;

    // Get users with their total profit/loss aggregated from games
    const usersWithProfit: UserWithGames[] = await prisma.user.findMany({
      select: {
        id: true,
        farcasterFid: true,
        username: true,
        avatar: true,
        games: {
          select: {
            profitLoss: true,
          },
        },
      },
    });

    // Calculate total profit for each user and sort by PnL (descending)
    const leaderboardData = usersWithProfit
      .map((user: UserWithGames) => {
        const totalPnl = user.games.reduce(
          (sum: number, game: GameWithProfitLoss) =>
            sum + Number(game.profitLoss),
          0
        );
        return {
          odI: user.id,
          fid: user.farcasterFid,
          username: user.username,
          pfp: user.avatar,
          pnl: totalPnl,
        };
      })
      .sort((a: { pnl: number }, b: { pnl: number }) => b.pnl - a.pnl);

    // Add rank to all entries
    const rankedData: LeaderboardEntry[] = leaderboardData.map(
      (entry: { fid: number; username: string; pfp: string | null; pnl: number }, index: number) => ({
        rank: index + 1,
        fid: entry.fid,
        username: entry.username,
        pfp: entry.pfp,
        pnl: entry.pnl,
      })
    );

    // Find current user's rank if FID provided
    let currentUser: LeaderboardEntry | null = null;
    if (currentUserFid) {
      const fid = parseInt(currentUserFid, 10);
      currentUser = rankedData.find((entry: LeaderboardEntry) => entry.fid === fid) || null;
    }

    // Apply pagination to leaderboard
    const paginatedData = rankedData.slice(skip, skip + limit);

    return NextResponse.json({
      leaderboard: paginatedData,
      currentUser,
      pagination: {
        page,
        limit,
        totalCount: rankedData.length,
        totalPages: Math.ceil(rankedData.length / limit),
        hasMore: skip + paginatedData.length < rankedData.length,
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
