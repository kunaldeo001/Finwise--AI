/**
 * Bank Sync Architecture Entry Point
 */

import { BankDataProvider } from './types';
import { CsvBankDataProvider } from './providers/csv-bank-provider';

let bankProviderInstance: BankDataProvider | null = null;

export function getBankDataProvider(): BankDataProvider {
  if (!bankProviderInstance) {
    bankProviderInstance = new CsvBankDataProvider();
  }
  return bankProviderInstance;
}

export * from './types';
export * from './reconciliation';
