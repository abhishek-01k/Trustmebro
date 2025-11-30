"use client";

import React from 'react';
import { Home, Trophy, User } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useGlobalContext } from '@/src/context/global-context';

type NavItem = 'home' | 'leaderboard' | 'profile';

const BottomNavigation = () => {

  const { activeTab, setActiveTab } = useGlobalContext();

  const navItems = [
    {
      id: 'home' as NavItem,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'leaderboard' as NavItem,
      label: 'Leaderboard',
      icon: Trophy,
    },
    {
      id: 'profile' as NavItem,
      label: 'Profile',
      icon: User,
    },
  ];

  const handleNavClick = (itemId: NavItem) => {
    setActiveTab(itemId);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center px-4 backdrop-blur-xl bg-gradient-to-t from-black/87 via-black/67 to-transparent"
      style={{ 
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <div 
        className="flex items-center gap-1.5 rounded-2xl backdrop-blur-2xl px-2 py-2 border border-white/10 bg-black/80 shadow-[0_-4px_24px_rgba(0,0,0,0.3)]"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                "relative flex items-center justify-center gap-2 rounded-full transition-all duration-300 ease-in-out",
                "active:scale-95",
                isActive 
                  ? "px-4 py-2 text-white bg-gradient-to-b from-[#a9062c] to-[#4e1624] hover:from-[#8d0524] hover:to-[#3d1119] font-semibold uppercase tracking-wide shadow-lg"
                  : "p-2.5 text-[#a9062c] hover:bg-[#a9062c]/20"
              )}
              aria-label={item.label}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 transition-all duration-300 shrink-0",
                  isActive && "scale-110"
                )} 
              />
              {isActive && (
                <span 
                  className="text-sm font-semibold transition-all duration-300 whitespace-nowrap"
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;