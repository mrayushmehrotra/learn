export interface User {
  _id: string;
  name: string;
  totalPoints: number;
  avatarUrl?: string;
  rank: number;
}

export interface ClaimResponse {
  user: User;
  pointsClaimed: number;
  message: string;
  leaderboard: User[];
} 