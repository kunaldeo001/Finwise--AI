/**
 * Market Data Entry Point
 * Exposes cached quote fetching and active provider introspection.
 */

import { MarketDataProvider, MarketQuote } from './types';
import { DemoMarketDataProvider } from './providers/demo-provider';
import { LiveApiMarketDataProvider } from './providers/live-api-provider';
import { globalMarketCache } from './cache';

let activeProviderInstance: MarketDataProvider | null = null;

export function getMarketDataProvider(): MarketDataProvider {
  if (activeProviderInstance) return activeProviderInstance;

  const providerType = process.env.MARKET_DATA_PROVIDER || 'auto';
  const apiKey = process.env.MARKET_DATA_API_KEY || process.env.NEXT_PUBLIC_MARKET_DATA_API_KEY;

  if (providerType === 'demo' || !apiKey) {
    activeProviderInstance = new DemoMarketDataProvider();
  } else {
    activeProviderInstance = new LiveApiMarketDataProvider(apiKey);
  }

  return activeProviderInstance;
}

export async function fetchQuoteCached(
  symbol: string,
  forceRefresh = false
): Promise<MarketQuote> {
  const cacheKey = globalMarketCache.getQuoteCacheKey(symbol);

  if (!forceRefresh) {
    const cached = globalMarketCache.get<MarketQuote>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const provider = getMarketDataProvider();
  const quote = await provider.getQuote(symbol);

  globalMarketCache.set(cacheKey, quote);
  return quote;
}

export function getMarketFeedStatus(): {
  isLive: boolean;
  providerName: string;
  disclaimer: string;
} {
  const provider = getMarketDataProvider();
  return {
    isLive: provider.isLiveConfigured,
    providerName: provider.name,
    disclaimer: 'Market data may be delayed and is provided for informational and planning purposes only.',
  };
}

export * from './types';
export * from './cache';
