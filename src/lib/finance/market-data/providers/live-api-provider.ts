/**
 * Live Market Data Provider (Alpha Vantage / Yahoo Finance Compatible)
 * Safely fetches quotes with timeouts, rate limit protection, and automatic fallback to Demo data.
 */

import { MarketDataProvider, MarketQuote, HistoricalPricePoint, MutualFundNav } from '../types';
import { DemoMarketDataProvider } from './demo-provider';

export class LiveApiMarketDataProvider implements MarketDataProvider {
  readonly id = 'live-api-provider';
  readonly name = 'Live Market Data Feed';
  readonly isLiveConfigured: boolean;

  private apiKey?: string;
  private apiBaseUrl: string;
  private fallbackProvider: DemoMarketDataProvider;

  constructor(apiKey?: string, apiBaseUrl = 'https://www.alphavantage.co/query') {
    this.apiKey = apiKey || process.env.MARKET_DATA_API_KEY || process.env.NEXT_PUBLIC_MARKET_DATA_API_KEY;
    this.apiBaseUrl = apiBaseUrl;
    this.isLiveConfigured = Boolean(this.apiKey && this.apiKey.trim().length > 0);
    this.fallbackProvider = new DemoMarketDataProvider();
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    if (!this.isLiveConfigured) {
      return this.fallbackProvider.getQuote(symbol);
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    const querySymbol = cleanSymbol.includes('.') ? cleanSymbol : `${cleanSymbol}.BSE`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout

      const url = `${this.apiBaseUrl}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(querySymbol)}&apikey=${this.apiKey}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Market API returned status ${res.status}`);
      }

      const json = await res.json();
      const globalQuote = json['Global Quote'];

      if (!globalQuote || !globalQuote['05. price']) {
        // Fall back gracefully if ticker not recognized or rate limited
        return this.fallbackProvider.getQuote(symbol);
      }

      const price = parseFloat(globalQuote['05. price']);
      const change = parseFloat(globalQuote['09. change'] || '0');
      const changePctStr = globalQuote['10. change percent'] || '0%';
      const changePercent = parseFloat(changePctStr.replace('%', ''));

      return {
        symbol: cleanSymbol,
        name: cleanSymbol,
        price,
        currency: 'INR',
        change,
        changePercent,
        high24h: globalQuote['03. high'] ? parseFloat(globalQuote['03. high']) : undefined,
        low24h: globalQuote['04. low'] ? parseFloat(globalQuote['04. low']) : undefined,
        volume: globalQuote['06. volume'] ? parseInt(globalQuote['06. volume'], 10) : undefined,
        lastUpdated: new Date().toISOString(),
        dataSource: 'live',
        providerName: 'Alpha Vantage Real-Time Feed',
      };
    } catch (err) {
      // Graceful degradation: never crash on external network or rate limit failure
      console.warn(`[MarketData] Live quote failed for ${symbol}, falling back to demo feed:`, err);
      return this.fallbackProvider.getQuote(symbol);
    }
  }

  async getQuotes(symbols: string[]): Promise<Record<string, MarketQuote>> {
    const results: Record<string, MarketQuote> = {};
    for (const sym of symbols) {
      results[sym] = await this.getQuote(sym);
    }
    return results;
  }

  async getHistoricalPrices(symbol: string, days = 30): Promise<HistoricalPricePoint[]> {
    return this.fallbackProvider.getHistoricalPrices(symbol, days);
  }

  async getMutualFundNAV(schemeCode: string): Promise<MutualFundNav> {
    return this.fallbackProvider.getMutualFundNAV(schemeCode);
  }

  async getExchangeRate(baseCurrency: string, targetCurrency: string): Promise<number> {
    return this.fallbackProvider.getExchangeRate(baseCurrency, targetCurrency);
  }
}
