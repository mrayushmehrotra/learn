import { VALIDATION } from './constants';

export const validateUserName = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return 'Name is required';
  }
  
  if (name.trim().length < VALIDATION.MIN_NAME_LENGTH) {
    return `Name must be at least ${VALIDATION.MIN_NAME_LENGTH} characters`;
  }
  
  if (name.trim().length > VALIDATION.MAX_NAME_LENGTH) {
    return `Name must be less than ${VALIDATION.MAX_NAME_LENGTH} characters`;
  }
  
  return null;
};

export const validateAvatarUrl = (url: string): string | null => {
  if (!url) return null; // Avatar is optional
  
  try {
    new URL(url);
    return null;
  } catch {
    return 'Please enter a valid URL';
  }
};

export const isValidPoints = (points: number): boolean => {
  return points >= VALIDATION.MIN_POINTS && points <= VALIDATION.MAX_POINTS;
};