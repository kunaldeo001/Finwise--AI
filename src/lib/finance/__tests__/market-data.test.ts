import { describe, it, expect, vi } from 'vitest';
import { DemoMarketDataProvider } from '../market-data/providers/demo-provider';
import { LiveApiMarketDataProvider } from '../market-data/providers/live-api-provider';
import { MarketDataCache } from '../market-data/cache';

describe('Live Market Data Architecture Tests', () => {
  it('DemoMarketDataProvider supplies realistic Indian equities and mutual fund NAVs', async () => {
    const provider = new DemoMarketDataProvider();
    expect(provider.isLiveConfigured).toBe(false);

    const reliance = await provider.getQuote('RELIANCE');
    expect(reliance.symbol).toBe('RELIANCE');
    expect(reliance.price).toBeGreaterThan(2000);
    expect(reliance.currency).toBe('INR');
    expect(reliance.dataSource).toBe('demo');

    const tcs = await provider.getQuote('TCS');
    expect(tcs.symbol).toBe('TCS');
    expect(tcs.price).toBeGreaterThan(3000);

    const nav = await provider.getMutualFundNAV('122639');
    expect(nav.nav).toBeGreaterThan(0);
    expect(nav.dataSource).toBe('demo');
  });

  it('DemoMarketDataProvider produces deterministic quotes for unlisted symbols without crashing', async () => {
    const provider = new DemoMarketDataProvider();
    const quoteA = await provider.getQuote('CUSTOM_TICKER');
    const quoteB = await provider.getQuote('CUSTOM_TICKER');

    expect(quoteA.price).toBe(quoteB.price);
    expect(quoteA.currency).toBe('INR');
    expect(quoteA.dataSource).toBe('demo');
  });

  it('LiveApiMarketDataProvider safely falls back to demo data on invalid key or network timeout', async () => {
    // Instantiate with dummy key pointing to invalid endpoint
    const liveProvider = new LiveApiMarketDataProvider('dummy-api-key', 'https://localhost:9999/invalid');
    expect(liveProvider.isLiveConfigured).toBe(true);

    // Should not throw; must gracefully degrade
    const fallbackQuote = await liveProvider.getQuote('INFY');
    expect(fallbackQuote).toBeDefined();
    expect(fallbackQuote.symbol).toBe('INFY');
    expect(fallbackQuote.price).toBeGreaterThan(0);
  });

  it('MarketDataCache caches values within TTL and supports explicit invalidation', () => {
    const cache = new MarketDataCache(60); // 60s TTL
    const cacheKey = cache.getQuoteCacheKey('INFY');

    expect(cache.get(cacheKey)).toBeNull();

    const sampleQuote = {
      symbol: 'INFY',
      name: 'Infosys',
      price: 1920,
      currency: 'INR',
      change: 15,
      changePercent: 0.8,
      lastUpdated: new Date().toISOString(),
      dataSource: 'demo' as const,
      providerName: 'Test',
    };

    cache.set(cacheKey, sampleQuote);
    expect(cache.get(cacheKey)).toEqual(sampleQuote);
    expect(cache.hasValid(cacheKey)).toBe(true);

    // Test explicit invalidation
    cache.invalidate(cacheKey);
    expect(cache.get(cacheKey)).toBeNull();
  });
});
