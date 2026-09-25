/**
 * Market Data Cache
 * In-memory TTL cache with timestamp tracking to prevent excessive API requests and rate-limiting.
 */

import { MarketQuote } from './types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export class MarketDataCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTtlMs: number;

  constructor(defaultTtlSeconds: number = 300) {
    this.defaultTtlMs = defaultTtlSeconds * 1000;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs: ttlMs ?? this.defaultTtlMs,
    });
  }

  hasValid(key: string): boolean {
    return this.get(key) !== null;
  }

  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  getQuoteCacheKey(symbol: string): string {
    return `quote:${symbol.toUpperCase().trim()}`;
  }
}

export const globalMarketCache = new MarketDataCache(300); // 5 minutes TTL
