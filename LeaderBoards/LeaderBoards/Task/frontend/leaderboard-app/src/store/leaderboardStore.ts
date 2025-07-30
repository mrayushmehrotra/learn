import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, ClaimHistory } from '../types';

interface LeaderboardState {
  users: User[];
  allUsers: User[];
  selectedUser: User | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  claimHistory: ClaimHistory[];
}

interface LeaderboardActions {
  setUsers: (users: User[]) => void;
  setAllUsers: (users: User[]) => void;
  setSelectedUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: LeaderboardState['pagination']) => void;
  setClaimHistory: (history: ClaimHistory[]) => void;
  updateUserPoints: (userId: string, newPoints: number) => void;
  addNewUser: (user: User) => void;
  reset: () => void;
}

const initialState: LeaderboardState = {
  users: [],
  allUsers: [],
  selectedUser: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  claimHistory: [],
};

export const useLeaderboardStore = create<LeaderboardState & LeaderboardActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setUsers: (users: User[]) => set({ users }),
      
      setAllUsers: (users: User[]) => set({ allUsers: users }),
      
      setSelectedUser: (user: User | null) => set({ selectedUser: user }),
      
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      setError: (error: string | null) => set({ error }),
      
      setPagination: (pagination: LeaderboardState['pagination']) => 
        set({ pagination }),
      
      setClaimHistory: (history: ClaimHistory[]) => 
        set({ claimHistory: history }),
      
      updateUserPoints: (userId: string, newPoints: number) => {
        const { users, allUsers } = get();
        
        const updateUser = (user: User) => 
          user._id === userId ? { ...user, totalPoints: newPoints } : user;
        
        set({
          users: users.map(updateUser),
          allUsers: allUsers.map(updateUser),
        });
      },
      
      addNewUser: (user: User) => {
        const { allUsers } = get();
        set({ allUsers: [...allUsers, user] });
      },
      
      reset: () => set(initialState),
    }),
    { name: 'leaderboard-store' }
  )
);