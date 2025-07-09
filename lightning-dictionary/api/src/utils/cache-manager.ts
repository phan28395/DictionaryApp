import Redis from 'ioredis';
import crypto from 'crypto';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

class CacheManager {
  private static instance: CacheManager;
  private redis: Redis | null = null;
  private localCache: Map<string, { value: any; expiry: number }> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0
  };
  private defaultTTL: number = 3600; // 1 hour default
  private prefix: string = 'dict:';
  private isRedisAvailable: boolean = false;

  private constructor() {
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Redis configuration
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryStrategy: (times: number) => {
          if (times > 3) {
            console.log('Redis connection failed, falling back to in-memory cache');
            this.isRedisAvailable = false;
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        enableOfflineQueue: false,
        lazyConnect: true
      };

      this.redis = new Redis(redisConfig);

      // Test connection
      await this.redis.connect();
      await this.redis.ping();
      this.isRedisAvailable = true;
      console.log('Redis cache connected successfully');

      // Handle connection events
      this.redis.on('error', (err) => {
        console.error('Redis error:', err);
        this.isRedisAvailable = false;
      });

      this.redis.on('connect', () => {
        this.isRedisAvailable = true;
      });

      this.redis.on('close', () => {
        this.isRedisAvailable = false;
      });

    } catch (error) {
      console.log('Redis not available, using in-memory cache only');
      this.isRedisAvailable = false;
      if (this.redis) {
        this.redis.disconnect();
        this.redis = null;
      }
    }
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private generateKey(key: string, prefix?: string): string {
    const finalPrefix = prefix || this.prefix;
    return `${finalPrefix}${key}`;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  public async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const fullKey = this.generateKey(key, options?.prefix);

    try {
      // Try Redis first if available
      if (this.isRedisAvailable && this.redis) {
        const value = await this.redis.get(fullKey);
        if (value) {
          this.stats.hits++;
          this.updateHitRate();
          return JSON.parse(value);
        }
      }

      // Fallback to local cache
      const cached = this.localCache.get(fullKey);
      if (cached && cached.expiry > Date.now()) {
        this.stats.hits++;
        this.updateHitRate();
        return cached.value;
      }

      // Clean up expired entry
      if (cached) {
        this.localCache.delete(fullKey);
      }

      this.stats.misses++;
      this.updateHitRate();
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  public async set<T>(
    key: string, 
    value: T, 
    options?: CacheOptions
  ): Promise<boolean> {
    const fullKey = this.generateKey(key, options?.prefix);
    const ttl = options?.ttl || this.defaultTTL;

    try {
      const serialized = JSON.stringify(value);

      // Set in Redis if available
      if (this.isRedisAvailable && this.redis) {
        await this.redis.setex(fullKey, ttl, serialized);
      }

      // Always set in local cache as backup
      this.localCache.set(fullKey, {
        value,
        expiry: Date.now() + (ttl * 1000)
      });

      this.stats.sets++;
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  public async delete(key: string, options?: CacheOptions): Promise<boolean> {
    const fullKey = this.generateKey(key, options?.prefix);

    try {
      // Delete from Redis if available
      if (this.isRedisAvailable && this.redis) {
        await this.redis.del(fullKey);
      }

      // Delete from local cache
      this.localCache.delete(fullKey);

      this.stats.deletes++;
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  public async deletePattern(pattern: string, options?: CacheOptions): Promise<number> {
    const prefix = options?.prefix || this.prefix;
    const fullPattern = `${prefix}${pattern}`;
    let deletedCount = 0;

    try {
      // Delete from Redis if available
      if (this.isRedisAvailable && this.redis) {
        const keys = await this.redis.keys(fullPattern);
        if (keys.length > 0) {
          deletedCount = await this.redis.del(...keys);
        }
      }

      // Delete from local cache
      const localPattern = new RegExp(fullPattern.replace(/\*/g, '.*'));
      for (const [key] of this.localCache) {
        if (localPattern.test(key)) {
          this.localCache.delete(key);
          deletedCount++;
        }
      }

      this.stats.deletes += deletedCount;
      return deletedCount;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  public async flush(): Promise<void> {
    try {
      // Flush Redis if available
      if (this.isRedisAvailable && this.redis) {
        const keys = await this.redis.keys(`${this.prefix}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      // Clear local cache
      this.localCache.clear();

      // Reset stats
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        hitRate: 0
      };
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  public getStats(): CacheStats {
    return { ...this.stats };
  }

  public getCacheInfo() {
    return {
      redisAvailable: this.isRedisAvailable,
      localCacheSize: this.localCache.size,
      stats: this.getStats()
    };
  }

  // Utility method for caching function results
  public async cached<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, options);
    return result;
  }

  // Hash-based caching for complex keys
  public hashKey(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return crypto.createHash('md5').update(str).digest('hex');
  }

  // Clean up expired entries from local cache
  public cleanupLocalCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.localCache) {
      if (entry.expiry <= now) {
        this.localCache.delete(key);
      }
    }
  }

  // Graceful shutdown
  public async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
    this.localCache.clear();
  }
}

// Export singleton instance
const cacheManager = CacheManager.getInstance();
export default cacheManager;

// Convenience decorator for caching method results
export function Cacheable(options?: CacheOptions) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = `${target.constructor.name}:${propertyName}:${cacheManager.hashKey(args)}`;
      return cacheManager.cached(key, () => method.apply(this, args), options);
    };

    return descriptor;
  };
}