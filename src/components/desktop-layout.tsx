import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

const DesktopLayout = () => {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen relative"
      style={{
        backgroundImage: 'url(/background_image.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="flex flex-col items-center justify-center gap-15 z-50">
        <div className="font-awesome flex flex-col items-center gap-2">
          <p className="text-2xl text-center text-white">
            Please open this app in Farcaster
          </p>
        </div>
        <Button
          size="lg"
          className="min-w-md"
          onClick={() => {
            try {
              // Try window.open first
              const newWindow = window.open(
                "https://farcaster.xyz/miniapps/vjnwKcePmS0G/trust-me-bro",
                "_blank",
                "noopener,noreferrer"
              );

              // If popup was blocked, fallback to window.location
              if (
                !newWindow ||
                newWindow.closed ||
                typeof newWindow.closed === "undefined"
              ) {
                window.location.href =
                  "https://farcaster.xyz/miniapps/vjnwKcePmS0G/trust-me-bro";
              }
            } catch {
              // Fallback if window.open fails
              window.location.href =
                "https://farcaster.xyz/miniapps/vjnwKcePmS0G/trust-me-bro";
            }
          }}
        >
          Open In Farcaster <ArrowUpRight />
        </Button>
      </div>
    </div>
  );
};

export default DesktopLayout;