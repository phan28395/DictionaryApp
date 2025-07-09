import { FastifyInstance } from 'fastify';
import { db } from '../database/db';
import { authenticateOptional } from '../middleware/auth';

interface HistoryEntry {
  id: string;
  word: string;
  timestamp: string;
  context?: string;
  definition?: string;
  language?: string;
  userId?: string;
}

export async function historyRoutes(fastify: FastifyInstance) {
  // Get user history
  fastify.get(
    '/history',
    { preHandler: authenticateOptional },
    async (request, reply) => {
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      try {
        const history = await db('user_history')
          .where('user_id', userId)
          .orderBy('looked_up_at', 'desc')
          .limit(1000);

        const formattedHistory: HistoryEntry[] = history.map(entry => ({
          id: entry.id,
          word: entry.word,
          timestamp: entry.looked_up_at,
          context: entry.context,
          definition: entry.definition_snapshot,
          language: entry.language || 'en',
          userId: entry.user_id
        }));

        return reply.send(formattedHistory);
      } catch (error) {
        console.error('Error fetching history:', error);
        return reply.status(500).send({ error: 'Failed to fetch history' });
      }
    }
  );

  // Add history entry
  fastify.post(
    '/history',
    { preHandler: authenticateOptional },
    async (request, reply) => {
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      const { entry } = request.body as { entry: HistoryEntry };

      try {
        await db('user_history').insert({
          user_id: userId,
          word: entry.word,
          context: entry.context,
          definition_snapshot: entry.definition,
          language: entry.language || 'en',
          looked_up_at: entry.timestamp || new Date().toISOString()
        });

        return reply.send({ success: true });
      } catch (error) {
        console.error('Error adding history entry:', error);
        return reply.status(500).send({ error: 'Failed to add history entry' });
      }
    }
  );

  // Delete history
  fastify.delete(
    '/history',
    { preHandler: authenticateOptional },
    async (request, reply) => {
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      const { beforeDate } = request.query as { beforeDate?: string };

      try {
        let query = db('user_history').where('user_id', userId);
        
        if (beforeDate) {
          query = query.where('looked_up_at', '<', beforeDate);
        }

        await query.del();

        return reply.send({ success: true });
      } catch (error) {
        console.error('Error deleting history:', error);
        return reply.status(500).send({ error: 'Failed to delete history' });
      }
    }
  );

  // Get history statistics
  fastify.get(
    '/history/stats',
    { preHandler: authenticateOptional },
    async (request, reply) => {
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      try {
        // Total lookups
        const totalLookups = await db('user_history')
          .where('user_id', userId)
          .count('* as count')
          .first();

        // Unique words
        const uniqueWords = await db('user_history')
          .where('user_id', userId)
          .countDistinct('word as count')
          .first();

        // Top words
        const topWords = await db('user_history')
          .select('word')
          .count('* as count')
          .where('user_id', userId)
          .groupBy('word')
          .orderBy('count', 'desc')
          .limit(20);

        // Daily activity (last 30 days)
        const dailyActivity = await db('user_history')
          .select(db.raw('DATE(looked_up_at) as date'))
          .count('* as count')
          .where('user_id', userId)
          .where('looked_up_at', '>', db.raw("datetime('now', '-30 days')"))
          .groupBy('date')
          .orderBy('date', 'desc');

        // Last lookup
        const lastLookup = await db('user_history')
          .where('user_id', userId)
          .orderBy('looked_up_at', 'desc')
          .first();

        const stats = {
          totalLookups: totalLookups?.count || 0,
          uniqueWords: uniqueWords?.count || 0,
          topWords: topWords.map(w => ({ word: w.word, count: w.count })),
          dailyActivity: dailyActivity.reduce((acc, day) => {
            acc[day.date] = day.count;
            return acc;
          }, {} as Record<string, number>),
          lastLookup: lastLookup?.looked_up_at
        };

        return reply.send(stats);
      } catch (error) {
        console.error('Error fetching history stats:', error);
        return reply.status(500).send({ error: 'Failed to fetch statistics' });
      }
    }
  );
}