export interface User {
  id: number;
  username: string;
  email: string;
  display_name?: string;
  preferences: UserPreferences;
  created_at: Date;
  updated_at: Date;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  fontSize?: 'small' | 'medium' | 'large';
  prefetchEnabled?: boolean;
  prefetchAggressiveness?: 'low' | 'medium' | 'high';
  language?: string;
  showExamples?: boolean;
  showUsage?: boolean;
  showSynonyms?: boolean;
  showAntonyms?: boolean;
  historyEnabled?: boolean;
  keyboardShortcutsEnabled?: boolean;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}

export interface LoginDto {
  username: string; // Can be username or email
  password: string;
}

export interface Session {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  updated_at: Date;
}

export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  sessionId: number;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
  expiresIn: number;
}