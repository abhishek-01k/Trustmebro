import React from "react";
import { useGlobalContext } from "@/context/global-context";
import { HomeScreen } from "@/modules/home";
import { LeaderboardScreen } from "@/modules/leaderboard";
import { ProfileScreen } from "@/modules/profile";
import { useUserProfile } from "@/queries/user";
import { useLeaderboard } from "@/queries/leaderboard";
import { WaitlistSection } from "@/modules/waitlist";

const BodySection = () => {
  const { activeTab } = useGlobalContext();
  const { data: userProfile, isLoading, error } = useUserProfile();
  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
    error: leaderboardError,
  } = useLeaderboard();

  return (
    <div className="flex-1 overflow-hidden">

      {activeTab === "home" && <HomeScreen />}
      {activeTab === "leaderboard" && (
        <LeaderboardScreen 
          leaderboardData={leaderboardData}
          isLoading={leaderboardLoading}
          error={leaderboardError}
        />
      )}
      {activeTab === "profile" && (
        <ProfileScreen 
          userProfile={userProfile} 
          isLoading={isLoading} 
          error={error} 
        />
      )}
    </div>
  );
};

export default BodySection;
