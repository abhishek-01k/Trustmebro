import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * NFT Metadata API for OpenSea and other NFT marketplaces
 * Returns ERC721 metadata standard JSON
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const tokenId = params.tokenId;
    const position = parseInt(tokenId, 10);

    // Validate token ID
    if (isNaN(position) || position < 0) {
      return NextResponse.json(
        { error: 'Invalid token ID' },
        { status: 400 }
      );
    }

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://trustmebro-tan.vercel.app';

    // Construct image URL (position-based)
    const imageUrl = `${baseUrl}/api/og/waitlist?pos=${position}`;

    // OpenSea metadata standard
    const metadata = {
      name: `Trust Me Bro #${position}`,
      description: 'Official Trust Me Bro waitlist pass - a soulbound NFT proving you were early. This NFT grants you exclusive access to the Trust Me Bro game and cannot be transferred.',
      image: imageUrl,
      external_url: baseUrl,
      attributes: [
        {
          trait_type: 'Position',
          value: position,
          display_type: 'number'
        },
        {
          trait_type: 'Type',
          value: 'Waitlist Pass'
        },
        {
          trait_type: 'Transferable',
          value: 'Soulbound'
        }
      ]
    };

    // Return with proper CORS headers for OpenSea
    return NextResponse.json(metadata, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('NFT metadata error:', error);
    return NextResponse.json(
      { error: 'Failed to generate metadata' },
      { status: 500 }
    );
  }
}

