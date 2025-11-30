"use client";

import React from 'react';
import { Home, Trophy, User } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { colors } from '@/src/lib/colors';
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
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center px-4 backdrop-blur-xl"
      style={{ 
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        background: `linear-gradient(to top, ${colors.background.dark}dd 0%, ${colors.background.dark}aa 50%, transparent 100%)`,
      }}
    >
      <div 
        className="flex items-center gap-1.5 rounded-2xl backdrop-blur-2xl px-2 py-2"
        style={{
          border: `1px solid ${colors.border.white10}`,
          backgroundColor: `${colors.card.medium}cc`,
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.3)',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                "relative flex items-center justify-center gap-2 rounded-xl transition-all duration-300 ease-in-out",
                "active:scale-95",
                isActive 
                  ? "px-4 py-2 text-white"
                  : "p-2.5"
              )}
              style={{
                backgroundColor: isActive ? colors.primary.light : 'transparent',
                color: isActive ? colors.text.white : colors.primary.light,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = `${colors.primary.light}20`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
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