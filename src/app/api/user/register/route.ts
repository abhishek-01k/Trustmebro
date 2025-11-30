import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { farcasterFid, username, avatar, walletAddress } = body;

    if (!farcasterFid || !username) {
      return NextResponse.json(
        { error: "farcasterFid and username are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.upsert({
      where: { farcasterFid },
      update: {
        username,
        avatar,
        walletAddress,
      },
      create: {
        farcasterFid,
        username,
        avatar,
        walletAddress,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
