import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Cached value or undefined
   */
  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  /**
   * Set value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in milliseconds (optional)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * Delete specific key from cache
   * @param key - Cache key to delete
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Delete multiple keys matching a pattern
   * Note: In-memory cache doesn't support pattern matching
   * For Redis, would need to implement differently
   * @param pattern - Pattern to match (e.g., 'pets:*')
   */
  async delPattern(pattern: string): Promise<void> {
    // For in-memory cache, we can't efficiently delete by pattern
    // This is a placeholder - would need Redis for true pattern deletion
    console.log(`Pattern deletion not supported in in-memory cache: ${pattern}`);
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    // Note: cache-manager v6 doesn't have reset method
    // Would need to track keys manually or use a different approach
    console.log('Cache reset requested (not fully supported in in-memory cache)');
  }

  /**
   * Generate cache key for pets query
   * @param filters - Query filters
   * @returns Cache key
   */
  getPetsCacheKey(filters: any): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((acc, key) => {
        acc[key] = filters[key];
        return acc;
      }, {} as any);

    return `pets:${JSON.stringify(sortedFilters)}`;
  }

  /**
   * Generate cache key for single pet
   * @param petId - Pet ID
   * @returns Cache key
   */
  getPetCacheKey(petId: string): string {
    return `pet:${petId}`;
  }

  /**
   * Generate cache key for ONG
   * @param ongId - ONG ID
   * @returns Cache key
   */
  getOngCacheKey(ongId: string): string {
    return `ong:${ongId}`;
  }

  /**
   * Invalidate all pet-related cache
   */
  async invalidatePetsCache(): Promise<void> {
    await this.delPattern('pets:*');
    await this.delPattern('pet:*');
  }

  /**
   * Invalidate specific pet cache
   * @param petId - Pet ID
   */
  async invalidatePetCache(petId: string): Promise<void> {
    await this.del(this.getPetCacheKey(petId));
    // Also invalidate all pet lists as they might include this pet
    await this.delPattern('pets:*');
  }

  /**
   * Invalidate ONG cache
   * @param ongId - ONG ID
   */
  async invalidateOngCache(ongId: string): Promise<void> {
    await this.del(this.getOngCacheKey(ongId));
    await this.delPattern('ongs:*');
  }
}
