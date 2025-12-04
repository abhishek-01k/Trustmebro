import React, { createContext, useContext, useState } from "react";
import { ActiveTab } from "../types/global";

type GlobalContextType = {
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  activeTab: ActiveTab;
  setActiveTab: (activeTab: ActiveTab) => void;
};

export const GlobalContext = createContext<GlobalContextType | null>(null);

export const GlobalContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  return (
    <GlobalContext.Provider value={{ isLoggedIn, setIsLoggedIn, activeTab, setActiveTab }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within GlobalContextProvider");
  }
  return context;
};