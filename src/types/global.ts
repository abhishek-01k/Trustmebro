export type ActiveTab = 'home' | 'leaderboard' | 'profile';

// Dummy data type
export interface LeaderboardEntry {
    rank: number;
    username: string;
    profit: number; // Can be positive (profit) or negative (loss)
    avatar?: string; // Profile image URL
    userId?: string; // User ID
  }

// User registration payload
export interface UserRegistrationPayload {
  farcasterFid: number;
  username: string;
  avatar?: string;
  walletAddress?: string;
}