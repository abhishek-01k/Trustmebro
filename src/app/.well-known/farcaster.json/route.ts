import { NextResponse } from "next/server";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL || "https://trustmebro-tan.vercel.app";

  const manifest = {
    accountAssociation: {
      header: "eyJmaWQiOjgzNTc4NSwidHlwZSI6ImF1dGgiLCJrZXkiOiIweEVCZDkwMzUzODY0ZkQ5MWRCZjk3RTk0NEE2ZkZjM2U5MTI1RDhEN2YifQ",
      payload: "eyJkb21haW4iOiJ0cnVzdG1lYnJvLXRhbi52ZXJjZWwuYXBwIn0",
      signature: "Z7enX7t0OUfNca5aVRfYjNzyUJUZmLzsAKJ3hCUMSqsLYdRaVIj8zrhXH6G41tkHiJv6WJekPdLNySlecZbhdhs=",
    },
    miniapp: {
      name: "Trust Me Bro",
      description: "A squid game: trust a tile, beat the odds, escape the death tile",
      version: "0.0.1",
      tags: ["games", "warpcast", "community", "friends", "entertainment"],
      iconUrl: `${appUrl}/trustmebro_logo.png`,
      imageUrl: `${appUrl}/trustmebro_logo.png`,
      ogTitle: "Trust Me Bro",
      subtitle: "Provably fair multiplier game",
      homeUrl: appUrl,
      splashImageUrl: `${appUrl}/trustmebro_logo.png`,
      splashBackgroundColor: "#000000",
      primaryCategory: "games",
    },
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}