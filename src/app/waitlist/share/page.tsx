import { Metadata } from 'next';
import { redirect } from 'next/navigation';

type Props = {
  searchParams: Promise<{ pos?: string; total?: string; fid?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const position = params.pos || '?';

  // Base URL for OG images
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://save-dome-distinction-industry.trycloudflare.com';
  // App URL for miniapp link
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster.xyz/miniapps/vjnwKcePmS0G/trust-me-bro';

  // Dynamic OG image with position only (total is fetched from DB by the OG route)
  const ogImageUrl = `${baseUrl}/api/og/waitlist?pos=${position}`;

  const title = `Position #${position} on TrustMeBro Waitlist`;
  const description = `Join the TrustMeBro waitlist. Trust the tap. 🔴🔺🟥`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [ogImageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
    other: {
      // Farcaster Frame meta tags - using launch_frame to open mini app directly
      'fc:frame': 'vNext',
      'fc:frame:image': ogImageUrl,
      'fc:frame:image:aspect_ratio': '1.91:1',
      'fc:frame:button:1': 'Mint Your Pass 🔴',
      'fc:frame:button:1:action': 'launch_frame',
      'fc:frame:button:1:target': appUrl,
    },
  };
}

export default async function WaitlistSharePage({ searchParams }: Props) {
  const params = await searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster.xyz/miniapps/vjnwKcePmS0G/trust-me-bro';

  // Redirect to main app if someone visits directly
  if (!params.pos) {
    redirect(appUrl);
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 border-4 border-[#a9062c] rounded-full"></div>
          <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[24px] border-b-[#a9062c]"></div>
          <div className="w-8 h-8 border-4 border-[#a9062c]"></div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">TrustMeBro</h1>
        <p className="text-[#a9062c] text-xl mb-8">Trust the tap.</p>
        <div className="bg-zinc-900 rounded-lg p-6 mb-6">
          <p className="text-zinc-400 text-sm mb-1">Waitlist Position</p>
          <p className="text-5xl font-bold text-white">#{params.pos}</p>
          <p className="text-zinc-500 mt-2">{params.total} degens waiting</p>
        </div>
        <a
          href={appUrl}
          className="inline-block bg-[#a9062c] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#8a0524] transition-colors"
        >
          Join Waitlist
        </a>
      </div>
    </div>
  );
}
