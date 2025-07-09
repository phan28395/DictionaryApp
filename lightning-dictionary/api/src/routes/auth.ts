import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth';
import { CreateUserDto, LoginDto, UserPreferences } from '../types/auth';
import { authenticate } from '../middleware/auth';

interface RegisterRequest {
  Body: CreateUserDto;
}

interface LoginRequest {
  Body: LoginDto;
}

interface UpdatePreferencesRequest {
  Body: Partial<UserPreferences>;
}

export async function authRoutes(fastify: FastifyInstance) {
  // Register new user
  fastify.post<RegisterRequest>('/register', async (request, reply) => {
    try {
      const user = await authService.createUser(request.body);
      
      // Auto-login after registration
      const authResponse = await authService.login(
        { username: request.body.username, password: request.body.password },
        request.ip,
        request.headers['user-agent']
      );
      
      return reply.status(201).send(authResponse);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
  
  // Login
  fastify.post<LoginRequest>('/login', async (request, reply) => {
    try {
      const authResponse = await authService.login(
        request.body,
        request.ip,
        request.headers['user-agent']
      );
      
      return reply.send(authResponse);
    } catch (error: any) {
      return reply.status(401).send({ error: error.message });
    }
  });
  
  // Logout
  fastify.post('/logout', { preHandler: authenticate }, async (request, reply) => {
    try {
      const token = request.headers.authorization?.substring(7);
      if (token) {
        await authService.logout(token);
      }
      
      return reply.send({ message: 'Logged out successfully' });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Failed to logout' });
    }
  });
  
  // Get current user
  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    try {
      const user = await authService.getUserById(request.user!.userId);
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      return reply.send({ user });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Failed to get user' });
    }
  });
  
  // Update user preferences
  fastify.put<UpdatePreferencesRequest>('/preferences', { preHandler: authenticate }, async (request, reply) => {
    try {
      const user = await authService.updateUserPreferences(request.user!.userId, request.body);
      
      return reply.send({ user });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Failed to update preferences' });
    }
  });
  
  // Get user history
  fastify.get('/history', { preHandler: authenticate }, async (request, reply) => {
    try {
      const history = await authService.getUserHistory(request.user!.userId);
      
      return reply.send({ history });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Failed to get history' });
    }
  });
}