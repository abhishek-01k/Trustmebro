export type ActiveTab = 'home' | 'leaderboard' | 'profile' | 'coming-soon';

export interface LeaderboardEntry {
    rank: number;
    username: string;
    profit: number; 
    avatar?: string; 
    userId?: string;
  }

// User registration payload
export interface UserRegistrationPayload {
  farcasterFid: number;
  username: string;
  avatar?: string | null;
  walletAddress?: string;
}