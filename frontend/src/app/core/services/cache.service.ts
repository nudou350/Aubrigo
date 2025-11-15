import { Injectable, signal, Signal } from '@angular/core';

/**
 * Cache entry structure
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  ttl: number; // milliseconds
  staleWhileRevalidate: boolean;
}

/**
 * Default cache configurations for different data types
 */
const DEFAULT_CACHE_CONFIG: Record<string, CacheConfig> = {
  pets: { ttl: 5 * 60 * 1000, staleWhileRevalidate: true }, // 5 minutes
  petDetail: { ttl: 10 * 60 * 1000, staleWhileRevalidate: true }, // 10 minutes
  ongs: { ttl: 30 * 60 * 1000, staleWhileRevalidate: true }, // 30 minutes
  favorites: { ttl: 2 * 60 * 1000, staleWhileRevalidate: false }, // 2 minutes
  cities: { ttl: 60 * 60 * 1000, staleWhileRevalidate: true }, // 1 hour
};

/**
 * Simple hash code generator for cache keys
 */
function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Centralized caching service with TTL support and invalidation strategies
 *
 * Features:
 * - TTL-based cache expiration
 * - Stale-while-revalidate pattern support
 * - Pattern-based cache invalidation
 * - Type-safe generic caching
 * - Cache statistics tracking
 */
@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0,
  };

  /**
   * Get data from cache
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Set data in cache
   * @param key Cache key
   * @param data Data to cache
   * @param config Cache configuration (string for predefined configs or CacheConfig object)
   */
  set<T>(key: string, data: T, config: string | CacheConfig): void {
    const cacheConfig =
      typeof config === 'string' ? DEFAULT_CACHE_CONFIG[config] : config;

    if (!cacheConfig) {
      console.warn(`No cache configuration found for: ${config}`);
      return;
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: cacheConfig.ttl,
    };

    this.cache.set(key, entry);
    this.stats.sets++;
  }

  /**
   * Check if cached data is stale (but not expired)
   * @param key Cache key
   * @param staleTtl Percentage of TTL to consider stale (default: 0.5 = 50%)
   * @returns True if data is stale
   */
  isStale(key: string, staleTtl = 0.5): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;

    const age = Date.now() - entry.timestamp;
    return age > entry.ttl * staleTtl;
  }

  /**
   * Check if cache entry is expired
   * @param entry Cache entry
   * @returns True if expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    const age = Date.now() - entry.timestamp;
    return age > entry.ttl;
  }

  /**
   * Invalidate cache entries by pattern
   * @param pattern Cache key pattern (supports '*' wildcard at the end)
   *
   * Examples:
   * - invalidate('pets:*') - clears all pet-related caches
   * - invalidate('pets:search:123') - clears specific cache entry
   */
  invalidate(pattern: string): void {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      let count = 0;
      for (const key of Array.from(this.cache.keys())) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
          count++;
        }
      }
      this.stats.invalidations += count;
    } else {
      if (this.cache.delete(pattern)) {
        this.stats.invalidations++;
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const count = this.cache.size;
    this.cache.clear();
    this.stats.invalidations += count;
  }

  /**
   * Generate cache key from prefix and parameters
   * @param prefix Cache key prefix
   * @param params Optional parameters to include in key
   * @returns Generated cache key
   */
  generateKey(prefix: string, params?: any): string {
    if (!params) return prefix;

    // Sort keys to ensure consistent key generation
    const sortedKeys = Object.keys(params).sort();
    const sortedParams: any = {};
    sortedKeys.forEach((key) => {
      sortedParams[key] = params[key];
    });

    const paramsString = JSON.stringify(sortedParams);
    const hash = hashCode(paramsString);
    return `${prefix}:${hash}`;
  }

  /**
   * Check if cache has a specific key
   * @param key Cache key
   * @returns True if key exists and not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Get cache statistics
   * @returns Cache statistics object
   */
  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
        : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: hitRate.toFixed(2) + '%',
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0,
    };
  }

  /**
   * Get all cache keys (for debugging)
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entry age in milliseconds
   * @param key Cache key
   * @returns Age in milliseconds or null if not found
   */
  getAge(key: string): number | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    return Date.now() - entry.timestamp;
  }
}
