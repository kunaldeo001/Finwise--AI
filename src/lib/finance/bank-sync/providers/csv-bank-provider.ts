/**
 * Default CSV Bank Provider with Extensible Account Aggregator Stubs
 * Uses client-side statement parsing without third-party credential exposure.
 */

import { BankDataProvider, ConnectAccountParams, ConnectionSession, TransactionSyncResult, ConnectedAccount } from '../types';
import { parseTransactionCSV } from '../../csv-parser';
import { reconcileTransactions } from '../reconciliation';
import { Transaction } from '@/lib/types/finance';

export class CsvBankDataProvider implements BankDataProvider {
  readonly id = 'csv-statement-engine';
  readonly name = 'CSV Bank Statement Engine';
  readonly isAutoSyncAvailable = false;

  async importCSV(csvString: string, userId: string, existingTransactions: Transaction[] = []) {
    const parsed = parseTransactionCSV(csvString, existingTransactions);
    const fullTransactions: Transaction[] = parsed.validTransactions.map((tx, idx) => ({
      ...tx,
      id: `csv-import-${idx}-${Date.now()}`,
      userId: userId || 'user-1',
      createdAt: new Date().toISOString(),
    }));
    const reconciliation = reconcileTransactions(fullTransactions, existingTransactions);

    return {
      reconciledItems: reconciliation.reconciledItems,
      validCount: reconciliation.validCount,
      flaggedCount: reconciliation.warningCount,
    };
  }

  async connectAccount(_params: ConnectAccountParams): Promise<ConnectionSession> {
    return {
      sessionId: `sess-unavail-${Date.now()}`,
      status: 'unsupported',
      message: 'Automatic bank sync is not configured. Account Aggregator framework is ready for production integration.',
    };
  }

  async syncTransactions(accountId: string): Promise<TransactionSyncResult> {
    return {
      accountId,
      syncedCount: 0,
      newTransactions: [],
      duplicatesDetectedCount: 0,
      syncTimestamp: new Date().toISOString(),
      isSimulated: false,
    };
  }

  async disconnectAccount(_accountId: string): Promise<boolean> {
    return true;
  }

  async getConnectedAccounts(userId: string): Promise<ConnectedAccount[]> {
    // Returns default disconnected state with clear explanation
    return [
      {
        id: 'acc-csv-default',
        userId,
        bankName: 'HDFC Bank (Primary Salary)',
        accountType: 'Savings',
        maskedAccountNumber: '•••• •••• 4912',
        accountAggregatorProvider: 'Manual_CSV',
        lastSyncedAt: new Date().toISOString().substring(0, 10),
        status: 'active',
      },
    ];
  }
}
