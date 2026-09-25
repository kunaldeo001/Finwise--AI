/**
 * Demo / Fallback Market Data Provider
 * Provides realistic, deterministic Indian stock, ETF, and mutual fund market prices when live API keys are not supplied.
 */

import { MarketDataProvider, MarketQuote, HistoricalPricePoint, MutualFundNav } from '../types';

const BASELINE_QUOTES: Record<string, Omit<MarketQuote, 'lastUpdated'>> = {
  RELIANCE: {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    price: 2985.4,
    currency: 'INR',
    change: 32.6,
    changePercent: 1.1,
    high24h: 3010.0,
    low24h: 2950.2,
    volume: 3840000,
    dataSource: 'demo',
    providerName: 'FinWise Simulated Feed',
  },
  TCS: {
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    price: 4210.8,
    currency: 'INR',
    change: -18.4,
    changePercent: -0.43,
    high24h: 4245.0,
    low24h: 4180.0,
    volume: 1250000,
    dataSource: 'demo',
    providerName: 'FinWise Simulated Feed',
  },
  HDFCBANK: {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd.',
    price: 1645.2,
    currency: 'INR',
    change: 14.8,
    changePercent: 0.91,
    high24h: 1658.0,
    low24h: 1630.5,
    volume: 8900000,
    dataSource: 'demo',
    providerName: 'FinWise Simulated Feed',
  },
  INFY: {
    symbol: 'INFY',
    name: 'Infosys Ltd.',
    price: 1912.5,
    currency: 'INR',
    change: 22.1,
    changePercent: 1.17,
    high24h: 1925.0,
    low24h: 1890.0,
    volume: 4500000,
    dataSource: 'demo',
    providerName: 'FinWise Simulated Feed',
  },
  GOLD: {
    symbol: 'GOLD',
    name: 'Physical Gold / Sovereign Gold Bond',
    price: 7420.0,
    currency: 'INR',
    change: 45.0,
    changePercent: 0.61,
    high24h: 7450.0,
    low24h: 7380.0,
    dataSource: 'demo',
    providerName: 'FinWise Simulated Feed',
  },
  NIFTY50: {
    symbol: 'NIFTY50',
    name: 'NIFTY 50 Index ETF',
    price: 25480.0,
    currency: 'INR',
    change: 142.5,
    changePercent: 0.56,
    high24h: 25520.0,
    low24h: 25390.0,
    dataSource: 'demo',
    providerName: 'FinWise Simulated Feed',
  },
};

export class DemoMarketDataProvider implements MarketDataProvider {
  readonly id = 'demo-provider';
  readonly name = 'Demo / Simulated Data Feed';
  readonly isLiveConfigured = false;

  async getQuote(symbol: string): Promise<MarketQuote> {
    const cleanSym = symbol.toUpperCase().replace(/\.NS$/, '').replace(/\.BO$/, '').trim();
    const existing = BASELINE_QUOTES[cleanSym];

    if (existing) {
      return {
        ...existing,
        lastUpdated: new Date().toISOString(),
      };
    }

    // Deterministic fallback for unknown symbols
    let hash = 0;
    for (let i = 0; i < cleanSym.length; i++) {
      hash = (hash << 5) - hash + cleanSym.charCodeAt(i);
      hash |= 0;
    }
    const simulatedPrice = Math.abs(hash % 3500) + 120;
    const simulatedChange = ((hash % 100) / 10);
    const simulatedPct = parseFloat(((simulatedChange / simulatedPrice) * 100).toFixed(2));

    return {
      symbol: cleanSym,
      name: `${cleanSym} Equities`,
      price: simulatedPrice,
      currency: 'INR',
      change: simulatedChange,
      changePercent: simulatedPct,
      lastUpdated: new Date().toISOString(),
      dataSource: 'demo',
      providerName: 'FinWise Simulated Feed',
    };
  }

  async getQuotes(symbols: string[]): Promise<Record<string, MarketQuote>> {
    const results: Record<string, MarketQuote> = {};
    for (const sym of symbols) {
      results[sym] = await this.getQuote(sym);
    }
    return results;
  }

  async getHistoricalPrices(symbol: string, days = 30): Promise<HistoricalPricePoint[]> {
    const quote = await this.getQuote(symbol);
    const points: HistoricalPricePoint[] = [];
    const now = new Date();

    for (let i = days; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const variance = Math.sin(i * 0.4) * (quote.price * 0.03);
      points.push({
        date: d.toISOString().substring(0, 10),
        price: Math.round((quote.price + variance) * 100) / 100,
        volume: 500000 + Math.round(Math.abs(Math.sin(i)) * 200000),
      });
    }
    return points;
  }

  async getMutualFundNAV(schemeCode: string): Promise<MutualFundNav> {
    return {
      schemeCode,
      schemeName: 'Parag Parikh Flexi Cap Fund - Direct Plan',
      nav: 78.42,
      date: new Date().toISOString().substring(0, 10),
      change: 0.35,
      changePercent: 0.45,
      dataSource: 'demo',
    };
  }

  async getExchangeRate(baseCurrency: string, targetCurrency: string): Promise<number> {
    if (baseCurrency.toUpperCase() === 'USD' && targetCurrency.toUpperCase() === 'INR') {
      return 83.85;
    }
    return 1.0;
  }
}
