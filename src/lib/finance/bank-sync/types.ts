/**
 * Bank Sync Architecture & Account Aggregator Abstraction
 * Supports CSV statement import as primary engine with an extensible interface for India's Account Aggregator (AA) ecosystem.
 */

import { Transaction } from '@/lib/types/finance';

export type BankConnectionStatus = 'active' | 'pending_consent' | 'disconnected' | 'error' | 'not_configured';

export interface ConnectedAccount {
  id: string;
  userId: string;
  bankName: string;
  accountType: 'Savings' | 'Current' | 'Credit Card';
  maskedAccountNumber: string;
  accountAggregatorProvider?: 'Setu' | 'Finvu' | 'OneMoney' | 'Sahamati' | 'Manual_CSV';
  consentExpiryDate?: string;
  lastSyncedAt: string;
  status: BankConnectionStatus;
  balance?: number;
}

export interface ConnectAccountParams {
  bankId: string;
  mobileNumber?: string;
  vpaHandle?: string; // e.g. user@okhdfcbank
}

export interface ConnectionSession {
  sessionId: string;
  status: 'redirect_required' | 'consent_sent' | 'unsupported';
  consentUrl?: string;
  message: string;
}

export interface TransactionSyncResult {
  accountId: string;
  syncedCount: number;
  newTransactions: Transaction[];
  duplicatesDetectedCount: number;
  syncTimestamp: string;
  isSimulated: boolean;
}

export type ReconciliationIssueType =
  | 'potential_duplicate'
  | 'missing_date'
  | 'invalid_amount'
  | 'unknown_merchant'
  | 'possible_self_transfer'
  | 'possible_recurring_subscription';

export interface ReconciliationItem {
  transaction: Transaction;
  isValid: boolean;
  issues: Array<{
    type: ReconciliationIssueType;
    message: string;
    severity: 'warning' | 'error' | 'info';
  }>;
}

export interface BankDataProvider {
  readonly id: string;
  readonly name: string;
  readonly isAutoSyncAvailable: boolean;

  importCSV(csvString: string, userId: string, existingTransactions?: Transaction[]): Promise<{
    reconciledItems: ReconciliationItem[];
    validCount: number;
    flaggedCount: number;
  }>;

  connectAccount(params: ConnectAccountParams): Promise<ConnectionSession>;

  syncTransactions(accountId: string): Promise<TransactionSyncResult>;

  disconnectAccount(accountId: string): Promise<boolean>;

  getConnectedAccounts(userId: string): Promise<ConnectedAccount[]>;
}
