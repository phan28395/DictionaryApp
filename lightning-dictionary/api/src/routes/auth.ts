import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth';
import { CreateUserDto, LoginDto, UserPreferences } from '../types/auth';
import { authenticate } from '../middleware/auth';
import { PreferencesService } from '../services/preferences';

interface RegisterRequest {
  Body: CreateUserDto;
}

interface LoginRequest {
  Body: LoginDto;
}

interface UpdatePreferencesRequest {
  Body: Partial<UserPreferences>;
}

interface ImportPreferencesRequest {
  Body: {
    data: any;
    mergeWithExisting?: boolean;
    importHistory?: boolean;
  };
}

interface ExportPreferencesQuery {
  Querystring: {
    includeHistory?: boolean;
  };
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
  
  // Reset preferences to defaults
  fastify.post('/preferences/reset', { preHandler: authenticate }, async (request, reply) => {
    try {
      const preferences = await PreferencesService.resetUserPreferences(request.user!.userId);
      
      return reply.send({ preferences });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Failed to reset preferences' });
    }
  });
  
  // Export user data (preferences and optionally history)
  fastify.get<ExportPreferencesQuery>('/export', { preHandler: authenticate }, async (request, reply) => {
    try {
      const includeHistory = request.query.includeHistory === 'true';
      const exportData = await PreferencesService.exportUserData(request.user!.userId, includeHistory);
      
      return reply.send(exportData);
    } catch (error: any) {
      return reply.status(500).send({ error: 'Failed to export user data' });
    }
  });
  
  // Import user preferences
  fastify.post<ImportPreferencesRequest>('/import', { preHandler: authenticate }, async (request, reply) => {
    try {
      await PreferencesService.importUserPreferences(
        request.user!.userId,
        request.body.data,
        {
          mergeWithExisting: request.body.mergeWithExisting,
          importHistory: request.body.importHistory,
        }
      );
      
      // Return updated preferences
      const preferences = await PreferencesService.getUserPreferences(request.user!.userId);
      
      return reply.send({ preferences });
    } catch (error: any) {
      return reply.status(400).send({ error: error.message || 'Failed to import preferences' });
    }
  });
  
  // Get preference statistics (admin endpoint - could be protected with admin role)
  fastify.get('/preferences/stats', async (request, reply) => {
    try {
      const stats = await PreferencesService.getPreferenceStats();
      
      return reply.send({ stats });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Failed to get preference statistics' });
    }
  });
}