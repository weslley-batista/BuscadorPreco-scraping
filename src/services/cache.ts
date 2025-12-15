
import { CacheStore, CacheEntry } from '@/types';

export class CacheService {
  private cache: CacheStore = new Map();

  set<T>(key: string, value: T, ttlMs: number): void {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttlMs
    };

    this.cache.set(key, entry);

    setTimeout(() => {
      this.cache.delete(key);
    }, ttlMs);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    this.cleanup();

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  debug(): void {
    console.log('Cache contents:', this.cache);
  }
}

export const cacheService = new CacheService();
