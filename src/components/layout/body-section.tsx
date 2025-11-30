import React from "react";
import { useGlobalContext } from "@/context/global-context";
import { HomeScreen } from "@/modules/home";
import { LeaderboardScreen } from "@/modules/leaderboard";
import { ProfileScreen } from "@/modules/profile";

const BodySection = () => {
  const { activeTab } = useGlobalContext();
  return (
    <div className="flex-1 overflow-hidden">
      {activeTab === "home" && <HomeScreen />}
      {activeTab === "leaderboard" && <LeaderboardScreen />}
      {activeTab === "profile" && <ProfileScreen />}
    </div>
  );
};

export default BodySection;
