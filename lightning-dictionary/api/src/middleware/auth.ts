import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth';
import { JWTPayload } from '../types/auth';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Authorization header missing or invalid' });
    }
    
    const token = authHeader.substring(7);
    const payload = await authService.verifyToken(token);
    
    request.user = payload;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

export async function optionalAuthenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await authService.verifyToken(token);
      request.user = payload;
    }
  } catch (error) {
    // Ignore errors for optional authentication
  }
}