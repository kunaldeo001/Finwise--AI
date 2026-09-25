/**
 * Market Data Types & Abstraction Contracts
 * Provides clean provider interfaces for real-time/delayed market quotes, mutual fund NAVs, and FX rates.
 */

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  high24h?: number;
  low24h?: number;
  volume?: number;
  lastUpdated: string;
  dataSource: 'live' | 'delayed' | 'demo' | 'manual';
  providerName: string;
}

export interface HistoricalPricePoint {
  date: string;
  price: number;
  volume?: number;
}

export interface MutualFundNav {
  schemeCode: string;
  schemeName: string;
  nav: number;
  date: string;
  change?: number;
  changePercent?: number;
  dataSource: 'live' | 'demo';
}

export interface MarketDataProvider {
  readonly id: string;
  readonly name: string;
  readonly isLiveConfigured: boolean;

  getQuote(symbol: string): Promise<MarketQuote>;
  getQuotes(symbols: string[]): Promise<Record<string, MarketQuote>>;
  getHistoricalPrices(symbol: string, days?: number): Promise<HistoricalPricePoint[]>;
  getMutualFundNAV(schemeCode: string): Promise<MutualFundNav>;
  getExchangeRate(baseCurrency: string, targetCurrency: string): Promise<number>;
}
