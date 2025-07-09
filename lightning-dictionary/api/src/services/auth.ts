import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../database/db';
import { User, CreateUserDto, LoginDto, Session, JWTPayload, AuthResponse, UserPreferences } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 10;

export class AuthService {
  async createUser(dto: CreateUserDto): Promise<User> {
    const { username, email, password, display_name } = dto;
    
    // Check if user already exists
    const existingUser = await db('users')
      .where('username', username)
      .orWhere('email', email)
      .first();
    
    if (existingUser) {
      if (existingUser.username === username) {
        throw new Error('Username already exists');
      }
      throw new Error('Email already exists');
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    
    // Default preferences
    const defaultPreferences: UserPreferences = {
      theme: 'system',
      fontSize: 'medium',
      prefetchEnabled: true,
      prefetchAggressiveness: 'medium',
      language: 'en',
      showExamples: true,
      showUsage: true,
      showSynonyms: true,
      showAntonyms: true,
      historyEnabled: true,
      keyboardShortcutsEnabled: true
    };
    
    // Insert user
    const [userId] = await db('users').insert({
      username,
      email,
      password_hash,
      display_name: display_name || username,
      preferences: JSON.stringify(defaultPreferences),
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Get the created user
    const user = await db('users').where('id', userId).first();
    user.preferences = JSON.parse(user.preferences);
    
    return user;
  }
  
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const { username, password } = dto;
    
    // Find user by username or email
    const user = await db('users')
      .where('username', username)
      .orWhere('email', username)
      .first();
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Parse preferences
    user.preferences = JSON.parse(user.preferences);
    
    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    const [sessionId] = await db('sessions').insert({
      user_id: user.id,
      token: '', // Will update with JWT
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Create JWT payload
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      sessionId
    };
    
    // Generate token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    
    // Update session with token
    await db('sessions').where('id', sessionId).update({ token });
    
    // Remove password hash from response
    delete user.password_hash;
    
    return {
      user,
      token,
      expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    };
  }
  
  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      
      // Check if session exists and is not expired
      const session = await db('sessions')
        .where('token', token)
        .where('expires_at', '>', new Date())
        .first();
      
      if (!session) {
        throw new Error('Session expired or invalid');
      }
      
      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
  
  async logout(token: string): Promise<void> {
    await db('sessions').where('token', token).delete();
  }
  
  async getUserById(userId: number): Promise<User | null> {
    const user = await db('users').where('id', userId).first();
    if (user) {
      user.preferences = JSON.parse(user.preferences);
      delete user.password_hash;
    }
    return user;
  }
  
  async updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<User> {
    const user = await db('users').where('id', userId).first();
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentPreferences = JSON.parse(user.preferences);
    const updatedPreferences = { ...currentPreferences, ...preferences };
    
    await db('users')
      .where('id', userId)
      .update({
        preferences: JSON.stringify(updatedPreferences),
        updated_at: new Date()
      });
    
    const updatedUser = await db('users').where('id', userId).first();
    updatedUser.preferences = JSON.parse(updatedUser.preferences);
    delete updatedUser.password_hash;
    
    return updatedUser;
  }
  
  async addToHistory(userId: number, word: string): Promise<void> {
    const existing = await db('user_history')
      .where({ user_id: userId, word })
      .first();
    
    if (existing) {
      await db('user_history')
        .where({ user_id: userId, word })
        .update({
          frequency: existing.frequency + 1,
          looked_up_at: new Date()
        });
    } else {
      await db('user_history').insert({
        user_id: userId,
        word,
        looked_up_at: new Date(),
        frequency: 1
      });
    }
  }
  
  async getUserHistory(userId: number, limit: number = 50): Promise<any[]> {
    return db('user_history')
      .where('user_id', userId)
      .orderBy('looked_up_at', 'desc')
      .limit(limit);
  }
}

export const authService = new AuthService();