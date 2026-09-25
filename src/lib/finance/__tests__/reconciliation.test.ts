import { describe, it, expect } from 'vitest';
import { reconcileTransactions } from '../bank-sync/reconciliation';
import { Transaction } from '@/lib/types/finance';

describe('Transaction Reconciliation Engine Tests', () => {
  const existingLedger: Transaction[] = [
    {
      id: 'tx-exist-1',
      userId: 'u1',
      amount: 1499,
      type: 'expense',
      category: 'Food & Dining',
      merchant: 'Swiggy',
      date: '2026-09-10',
      createdAt: '2026-09-10T12:00:00Z',
    },
    {
      id: 'tx-exist-2',
      userId: 'u1',
      amount: 45000,
      type: 'expense',
      category: 'Debt & EMI',
      merchant: 'HDFC Home Loan',
      date: '2026-09-05',
      createdAt: '2026-09-05T12:00:00Z',
    },
  ];

  it('detects duplicate transactions against existing ledger items', () => {
    const incoming: Transaction[] = [
      {
        id: 'inc-1',
        userId: 'u1',
        amount: 1499,
        type: 'expense',
        category: 'Food & Dining',
        merchant: 'Swiggy',
        date: '2026-09-10',
        createdAt: '2026-09-10T14:00:00Z',
      },
    ];

    const result = reconcileTransactions(incoming, existingLedger);
    expect(result.duplicateCount).toBe(1);
    expect(result.reconciledItems[0].issues.some((i) => i.type === 'potential_duplicate')).toBe(true);
  });

  it('flags missing dates and invalid amounts as errors', () => {
    const invalidItems: Transaction[] = [
      {
        id: 'bad-1',
        userId: 'u1',
        amount: -250,
        type: 'expense',
        category: 'Shopping',
        merchant: 'Amazon',
        date: '2026-09-12',
        createdAt: '2026-09-12T00:00:00Z',
      },
      {
        id: 'bad-2',
        userId: 'u1',
        amount: 500,
        type: 'expense',
        category: 'Shopping',
        merchant: 'Flipkart',
        date: 'invalid-date',
        createdAt: '2026-09-12T00:00:00Z',
      },
    ];

    const result = reconcileTransactions(invalidItems, existingLedger);
    expect(result.validCount).toBe(0);
    expect(result.reconciledItems[0].isValid).toBe(false);
    expect(result.reconciledItems[0].issues.some((i) => i.type === 'invalid_amount')).toBe(true);
    expect(result.reconciledItems[1].issues.some((i) => i.type === 'missing_date')).toBe(true);
  });

  it('identifies internal transfers and potential recurring subscriptions', () => {
    const mixedItems: Transaction[] = [
      {
        id: 'transfer-1',
        userId: 'u1',
        amount: 20000,
        type: 'expense',
        category: 'Other',
        merchant: 'Self Transfer to Savings Account',
        date: '2026-09-15',
        createdAt: '2026-09-15T00:00:00Z',
      },
      {
        id: 'sub-1',
        userId: 'u1',
        amount: 649,
        type: 'expense',
        category: 'Subscriptions',
        merchant: 'Netflix Entertainment India',
        date: '2026-09-18',
        createdAt: '2026-09-18T00:00:00Z',
      },
    ];

    const result = reconcileTransactions(mixedItems, existingLedger);
    expect(result.validCount).toBe(2);

    const transferItem = result.reconciledItems.find((r) => r.transaction.id === 'transfer-1');
    expect(transferItem?.issues.some((i) => i.type === 'possible_self_transfer')).toBe(true);

    const subItem = result.reconciledItems.find((r) => r.transaction.id === 'sub-1');
    expect(subItem?.issues.some((i) => i.type === 'possible_recurring_subscription')).toBe(true);
  });
});
