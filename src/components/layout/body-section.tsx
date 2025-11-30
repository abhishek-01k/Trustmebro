import React from "react";
import { useGlobalContext } from "@/src/context/global-context";
import { HomeScreen } from "@/src/modules/home";
import { LeaderboardScreen } from "@/src/modules/leaderboard";
import { ProfileScreen } from "@/src/modules/profile";

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
