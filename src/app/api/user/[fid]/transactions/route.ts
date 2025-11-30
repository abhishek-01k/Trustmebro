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

    // Get pagination and filter params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const type = searchParams.get("type"); // Optional filter by transaction type
    const skip = (page - 1) * limit;

    // Find user
    const user = await prisma.user.findUnique({
      where: { farcasterFid },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build where clause
    const whereClause: {
      userId: string;
      type?: "DEPOSIT" | "WITHDRAWAL" | "GAME_ENTRY" | "GAME_PAYOUT";
    } = { userId: user.id };

    if (
      type &&
      ["DEPOSIT", "WITHDRAWAL", "GAME_ENTRY", "GAME_PAYOUT"].includes(type)
    ) {
      whereClause.type = type as
        | "DEPOSIT"
        | "WITHDRAWAL"
        | "GAME_ENTRY"
        | "GAME_PAYOUT";
    }

    // Get transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          game: {
            select: {
              id: true,
              gameType: true,
              result: true,
              playedAt: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      transactions: transactions.map((tx) => ({
        ...tx,
        amount: tx.amount.toNumber(),
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + transactions.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch user transactions" },
      { status: 500 }
    );
  }
}
