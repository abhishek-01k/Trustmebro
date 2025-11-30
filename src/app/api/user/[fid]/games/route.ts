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

    // Get pagination params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    // Find user
    const user = await prisma.user.findUnique({
      where: { farcasterFid },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get games with pagination
    const [games, totalCount] = await Promise.all([
      prisma.game.findMany({
        where: { userId: user.id },
        orderBy: { playedAt: "desc" },
        skip,
        take: limit,
        include: {
          transactions: {
            select: {
              id: true,
              type: true,
              amount: true,
              txHash: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.game.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      games: games.map((game) => ({
        ...game,
        profitLoss: game.profitLoss.toNumber(),
        transactions: game.transactions.map((tx) => ({
          ...tx,
          amount: tx.amount.toNumber(),
        })),
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + games.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching user games:", error);
    return NextResponse.json(
      { error: "Failed to fetch user games" },
      { status: 500 }
    );
  }
}
