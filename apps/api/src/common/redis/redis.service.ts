import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

const DEFAULT_TTL_SECONDS = 1800; // 30 minutes

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isAvailable = false;
  // Local fallback cache in case Redis is not accessible (e.g. unit tests or local dev without redis)
  private readonly fallbackLocks = new Map<
    string,
    { expiresAt: number; studentId: string; classId: string }
  >();

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT) || 6380;

    try {
      this.client = new Redis({
        host,
        port,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn(
              `Redis connection failed after ${times} retries. Falling back to in-memory mode.`,
            );
            return null;
          }
          return Math.min(times * 100, 1000);
        },
      });

      this.client.on('connect', () => {
        this.isAvailable = true;
        this.logger.log(`Connected to Redis at ${host}:${port}`);
      });

      this.client.on('error', (err) => {
        this.isAvailable = false;
        this.logger.warn(`Redis connection error: ${err.message}`);
      });

      this.client.connect().catch((err) => {
        this.logger.warn(
          `Could not establish initial Redis connection: ${err.message}. Operating in fallback mode.`,
        );
      });
    } catch (err) {
      this.logger.warn(`Failed to initialize Redis client: ${err}`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // ignore disconnect errors on shutdown
      }
    }
  }

  private getLockKey(classId: string, studentId: string): string {
    return `kalameh:lock:class:${classId}:${studentId}`;
  }

  async acquireClassLock(
    classId: string,
    studentId: string,
    ttlSeconds: number = DEFAULT_TTL_SECONDS,
  ): Promise<boolean> {
    const key = this.getLockKey(classId, studentId);

    if (this.isAvailable && this.client) {
      try {
        const result = await this.client.set(
          key,
          studentId,
          'EX',
          ttlSeconds,
          'NX',
        );
        return result === 'OK';
      } catch (err) {
        this.logger.warn(`Error setting Redis key: ${err}`);
      }
    }

    // Fallback in-memory
    const existing = this.fallbackLocks.get(key);
    const now = Date.now();
    if (existing && existing.expiresAt > now) {
      return false;
    }

    this.fallbackLocks.set(key, {
      expiresAt: now + ttlSeconds * 1000,
      studentId,
      classId,
    });
    return true;
  }

  async getClassLockRemainingTtl(
    classId: string,
    studentId: string,
  ): Promise<number> {
    const key = this.getLockKey(classId, studentId);

    if (this.isAvailable && this.client) {
      try {
        const ttl = await this.client.ttl(key);
        return ttl > 0 ? ttl : 0;
      } catch (err) {
        this.logger.warn(`Error fetching Redis TTL: ${err}`);
      }
    }

    const fallback = this.fallbackLocks.get(key);
    if (!fallback) return 0;
    const remaining = Math.max(
      0,
      Math.floor((fallback.expiresAt - Date.now()) / 1000),
    );
    if (remaining === 0) {
      this.fallbackLocks.delete(key);
    }
    return remaining;
  }

  async hasClassLock(classId: string, studentId: string): Promise<boolean> {
    const ttl = await this.getClassLockRemainingTtl(classId, studentId);
    return ttl > 0;
  }

  async releaseClassLock(classId: string, studentId: string): Promise<void> {
    const key = this.getLockKey(classId, studentId);

    if (this.isAvailable && this.client) {
      try {
        await this.client.del(key);
      } catch (err) {
        this.logger.warn(`Error deleting Redis key: ${err}`);
      }
    }

    this.fallbackLocks.delete(key);
  }

  async countClassLocks(classId: string): Promise<number> {
    if (this.isAvailable && this.client) {
      try {
        const pattern = `kalameh:lock:class:${classId}:*`;
        const keys = await this.client.keys(pattern);
        return keys.length;
      } catch (err) {
        this.logger.warn(`Error scanning Redis keys: ${err}`);
      }
    }

    const now = Date.now();
    let count = 0;
    for (const [key, lock] of this.fallbackLocks.entries()) {
      if (lock.classId === classId) {
        if (lock.expiresAt > now) {
          count++;
        } else {
          this.fallbackLocks.delete(key);
        }
      }
    }
    return count;
  }

  async getStudentActiveReservation(
    studentId: string,
  ): Promise<{ classId: string; remainingSeconds: number } | null> {
    if (this.isAvailable && this.client) {
      try {
        const pattern = `kalameh:lock:class:*:${studentId}`;
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          const key = keys[0];
          // key format: kalameh:lock:class:{classId}:{studentId}
          const parts = key.split(':');
          const classId = parts[3];
          const ttl = await this.client.ttl(key);
          if (ttl > 0 && classId) {
            return { classId, remainingSeconds: ttl };
          }
        }
      } catch (err) {
        this.logger.warn(
          `Error getting student reservation from Redis: ${err}`,
        );
      }
    }

    const now = Date.now();
    for (const [key, lock] of this.fallbackLocks.entries()) {
      if (lock.studentId === studentId) {
        if (lock.expiresAt > now) {
          return {
            classId: lock.classId,
            remainingSeconds: Math.floor((lock.expiresAt - now) / 1000),
          };
        } else {
          this.fallbackLocks.delete(key);
        }
      }
    }

    return null;
  }
}
