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
  src: "../../public/font/Game Of Squids.ttf",
  variable: "--font-game-of-squids",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Trust Me Bro",
  description: "Bet, Pick and win based on your luck",
  icons: {
    icon: "/trustmebro_logo.png",
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
