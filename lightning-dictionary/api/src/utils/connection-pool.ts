import { Knex } from 'knex';
import knex from 'knex';
import knexConfig from '../../knexfile';

interface PoolConfig {
  min?: number;
  max?: number;
  acquireTimeoutMillis?: number;
  createTimeoutMillis?: number;
  destroyTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  reapIntervalMillis?: number;
  createRetryIntervalMillis?: number;
  propagateCreateError?: boolean;
}

class ConnectionPool {
  private static instance: ConnectionPool;
  private db: Knex;
  private poolConfig: PoolConfig;
  private connectionCount: number = 0;
  private activeConnections: number = 0;
  private peakConnections: number = 0;

  private constructor() {
    const environment = process.env.NODE_ENV || 'development';
    const config = knexConfig[environment];

    // Enhanced pool configuration for better performance
    this.poolConfig = {
      min: environment === 'production' ? 5 : 2,
      max: environment === 'production' ? 20 : 10,
      acquireTimeoutMillis: 30000, // 30 seconds
      createTimeoutMillis: 30000,   // 30 seconds
      destroyTimeoutMillis: 5000,   // 5 seconds
      idleTimeoutMillis: 30000,     // 30 seconds
      reapIntervalMillis: 1000,     // 1 second
      createRetryIntervalMillis: 100, // 100ms
      propagateCreateError: true
    };

    // Merge with existing config
    const enhancedConfig = {
      ...config,
      pool: {
        ...config.pool,
        ...this.poolConfig,
        afterCreate: (conn: any, done: Function) => {
          this.connectionCount++;
          this.activeConnections++;
          this.peakConnections = Math.max(this.peakConnections, this.activeConnections);
          done(null, conn);
        }
      }
    };

    this.db = knex(enhancedConfig);

    // Monitor pool events if available
    if (this.db.client.pool) {
      this.setupPoolMonitoring();
    }
  }

  private setupPoolMonitoring(): void {
    const pool = this.db.client.pool;

    // Monitor connection acquisition
    pool.on('acquire', () => {
      this.activeConnections++;
      this.peakConnections = Math.max(this.peakConnections, this.activeConnections);
    });

    // Monitor connection release
    pool.on('release', () => {
      this.activeConnections--;
    });

    // Monitor pool creation errors
    pool.on('createFail', (err: Error) => {
      console.error('Failed to create database connection:', err);
    });

    // Monitor pool destruction
    pool.on('destroy', () => {
      this.connectionCount--;
    });
  }

  public static getInstance(): ConnectionPool {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new ConnectionPool();
    }
    return ConnectionPool.instance;
  }

  public getConnection(): Knex {
    return this.db;
  }

  public async getPoolStats() {
    const pool = this.db.client.pool;
    if (!pool) {
      return {
        error: 'Pool not available'
      };
    }

    return {
      total: this.connectionCount,
      active: this.activeConnections,
      idle: this.connectionCount - this.activeConnections,
      peak: this.peakConnections,
      waiting: pool.numPendingAcquires?.() || 0,
      config: this.poolConfig
    };
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.db.raw('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  public async closePool(): Promise<void> {
    try {
      await this.db.destroy();
      this.connectionCount = 0;
      this.activeConnections = 0;
    } catch (error) {
      console.error('Error closing database pool:', error);
      throw error;
    }
  }

  // Utility method for transaction management with retry logic
  public async transaction<T>(
    callback: (trx: Knex.Transaction) => Promise<T>,
    retries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await this.db.transaction(callback);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry for non-transient errors
        if (!this.isTransientError(error)) {
          throw error;
        }

        // Wait before retry with exponential backoff
        if (attempt < retries - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempt) * 100)
          );
        }
      }
    }

    throw lastError;
  }

  private isTransientError(error: any): boolean {
    // SQLite busy errors
    if (error.code === 'SQLITE_BUSY' || error.code === 'SQLITE_LOCKED') {
      return true;
    }

    // Connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return true;
    }

    return false;
  }
}

// Export singleton instance
const connectionPool = ConnectionPool.getInstance();
export default connectionPool;

// Export the database connection directly for backward compatibility
export const db = connectionPool.getConnection();