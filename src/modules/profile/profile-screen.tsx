"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePrivy } from "@privy-io/react-auth";
import { UserProfile } from "@/queries/user";
import UserStatsCardSkeleton from "./components/user-stats-card-skeleton";
import UserStatsCard from "./components/user-stats-card";

interface ProfileScreenProps {
  userProfile?: UserProfile;
  isLoading: boolean;
  error: Error | null;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  userProfile, 
  isLoading, 
  error 
}) => {
  const { user } = usePrivy();

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div 
        className="relative flex flex-col h-full w-full min-h-screen items-center justify-center p-4 pb-32"
        style={{
          backgroundImage: 'url(/background_image.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <p className="text-red-400">Error loading profile: {error.message}</p>
      </div>
    );
  }

  return (
    <div 
      className="relative flex flex-col h-full w-full min-h-screen p-4 pb-32"
      style={{
        backgroundImage: 'url(/background_image.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <ScrollArea className="flex-1 h-0">
        <div className="px-4 pt-4 pb-24 space-y-4">
          {isLoading ? (
            <UserStatsCardSkeleton />
          ) : (
            <UserStatsCard userProfile={userProfile} />
          )}

        </div>
      </ScrollArea>
    </div>
  );
};

export default ProfileScreen;
