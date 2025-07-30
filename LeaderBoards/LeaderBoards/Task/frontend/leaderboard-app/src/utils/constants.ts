export const API_ENDPOINTS = {
  USERS: '/users',
  CLAIM: '/claim',
  LEADERBOARD: '/leaderboard',
  HISTORY: '/history',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
} as const;

export const REFRESH_INTERVALS = {
  LEADERBOARD: 10000, // 10 seconds
  HISTORY: 30000, // 30 seconds
} as const;

export const VALIDATION = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MIN_POINTS: 1,
  MAX_POINTS: 10,
} as const;

export const UI = {
  AVATAR_SIZE: 48,
  PODIUM_POSITIONS: 3,
  TOAST_DURATION: 3000,
} as const;