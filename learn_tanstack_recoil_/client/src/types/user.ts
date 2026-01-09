export interface CreateUserInput {
  name: string;
  email: string;
  hashedPassword: string;
  avatar?: string;
  isActive?: boolean;
  isPro?: boolean;
  todos?: Record<string, never>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  hashedPassword: string;
  avatar?: string | null;
  isActive: boolean;
  isPro: boolean;
  todos: Record<string, never>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiError {
  message: string;
  code: string;
  httpStatus: number;
}

