import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const gameOfSquids = localFont({
  src: "../../public/font/GameOfSquids.ttf",
  variable: "--font-game-of-squids",
  display: "swap",
  weight: "400",
});

const appUrl = process.env.NEXT_PUBLIC_URL || "https://trustmebro-tan.vercel.app";

export const metadata: Metadata = {
  title: "Trust Me Bro",
  description: "Bet, Pick and win based on your luck",
  icons: {
    icon: "/trustmebro_logo.png",
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${appUrl}/background_image.png`,
      button: {
        title: "Join waitlist ⭕️",
        action: {
          type: "launch_frame",
          name: "Trust me bro",
          url: appUrl,
          splashImageUrl: `${appUrl}/background_image.png`,
          splashBackgroundColor: "#000000",
        },
      },
    }),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${gameOfSquids.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
