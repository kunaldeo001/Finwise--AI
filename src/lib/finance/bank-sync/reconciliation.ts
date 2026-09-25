/**
 * Transaction Reconciliation Engine
 * Detects duplicates, transfers, recurring patterns, and anomalies prior to permanent ledger writes.
 */

import { Transaction } from '@/lib/types/finance';
import { ReconciliationItem, ReconciliationIssueType } from './types';

export function reconcileTransactions(
  incomingTransactions: Transaction[],
  existingTransactions: Transaction[] = []
): {
  reconciledItems: ReconciliationItem[];
  validCount: number;
  duplicateCount: number;
  warningCount: number;
} {
  let validCount = 0;
  let duplicateCount = 0;
  let warningCount = 0;

  const reconciledItems: ReconciliationItem[] = incomingTransactions.map((tx) => {
    const issues: Array<{
      type: ReconciliationIssueType;
      message: string;
      severity: 'warning' | 'error' | 'info';
    }> = [];

    // 1. Amount validation
    if (!tx.amount || isNaN(tx.amount) || tx.amount <= 0) {
      issues.push({
        type: 'invalid_amount',
        message: 'Invalid transaction amount (must be positive).',
        severity: 'error',
      });
    }

    // 2. Date validation
    if (!tx.date || isNaN(new Date(tx.date).getTime())) {
      issues.push({
        type: 'missing_date',
        message: 'Missing or unparseable transaction date.',
        severity: 'error',
      });
    }

    // 3. Duplicate Detection against existing ledger
    const isDuplicate = existingTransactions.some((existing) => {
      const sameDate = existing.date === tx.date;
      const sameAmount = Math.abs(existing.amount - tx.amount) < 0.01;
      const normExist = (existing.merchant || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const normIncoming = (tx.merchant || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const sameMerchant = normExist === normIncoming || normExist.includes(normIncoming) || normIncoming.includes(normExist);
      return sameDate && sameAmount && sameMerchant;
    });

    if (isDuplicate) {
      duplicateCount++;
      issues.push({
        type: 'potential_duplicate',
        message: `Matches an existing ${tx.date} transaction for ₹${tx.amount.toLocaleString('en-IN')}.`,
        severity: 'warning',
      });
    }

    // 4. Unknown or vague merchant description
    const merchantLower = (tx.merchant || '').toLowerCase().trim();
    if (!tx.merchant || merchantLower.length < 3 || ['upi', 'pos', 'payment', 'transfer', 'debit', 'txn', 'card'].includes(merchantLower)) {
      issues.push({
        type: 'unknown_merchant',
        message: 'Generic merchant name. Consider labeling merchant clearly before saving.',
        severity: 'info',
      });
    }

    // 5. Possible internal transfer detection
    if (
      merchantLower.includes('self transfer') ||
      merchantLower.includes('to self') ||
      merchantLower.includes('sweep') ||
      merchantLower.includes('auto sweep') ||
      merchantLower.includes('internal trf')
    ) {
      issues.push({
        type: 'possible_self_transfer',
        message: 'Looks like an internal transfer between personal accounts. Exclude to avoid double counting.',
        severity: 'info',
      });
    }

    // 6. Possible recurring subscription detection
    const isSubscriptionKeyword = [
      'netflix',
      'spotify',
      'prime',
      'youtube',
      'chatgpt',
      'hotstar',
      'adobe',
      'github',
      'apple',
      'google one',
    ].some((k) => merchantLower.includes(k));

    if (isSubscriptionKeyword || tx.isRecurring) {
      issues.push({
        type: 'possible_recurring_subscription',
        message: 'Identified as a recurring subscription.',
        severity: 'info',
      });
    }

    const hasError = issues.some((i) => i.severity === 'error');
    if (!hasError) {
      validCount++;
    }
    if (issues.some((i) => i.severity === 'warning')) {
      warningCount++;
    }

    return {
      transaction: tx,
      isValid: !hasError,
      issues,
    };
  });

  return {
    reconciledItems,
    validCount,
    duplicateCount,
    warningCount,
  };
}
