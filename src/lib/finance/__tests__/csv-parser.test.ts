import { describe, it, expect } from 'vitest';
import { parseTransactionCSV } from '../csv-parser';
import { Transaction } from '@/lib/types/finance';

describe('CSV Transaction Parser', () => {
  it('parses valid CSV lines into structured transactions', () => {
    const csv = `Date,Description,Amount,Type
2026-09-01,Tech Innovations Salary,120000,income
2026-09-05,Swiggy Restaurant,1450,expense
2026-09-10,Bescom Electricity,3200,expense`;

    const result = parseTransactionCSV(csv);

    expect(result.validTransactions.length).toBe(3);
    expect(result.errors.length).toBe(0);
    expect(result.validTransactions[0].type).toBe('income');
    expect(result.validTransactions[0].amount).toBe(120000);
    expect(result.validTransactions[1].category).toBe('Food & Dining');
    expect(result.validTransactions[2].category).toBe('Utilities');
  });

  it('normalizes DD/MM/YYYY dates to YYYY-MM-DD', () => {
    const csv = `Date,Description,Amount
15/09/2026,Uber Premier,680`;

    const result = parseTransactionCSV(csv);
    expect(result.validTransactions.length).toBe(1);
    expect(result.validTransactions[0].date).toBe('2026-09-15');
    expect(result.validTransactions[0].category).toBe('Transportation');
  });

  it('identifies and excludes duplicate transactions', () => {
    const existing: Transaction[] = [
      {
        id: '1',
        userId: 'u1',
        date: '2026-09-05',
        amount: 1450,
        merchant: 'Dining & Delivery',
        type: 'expense',
        category: 'Food & Dining',
        createdAt: new Date().toISOString(),
      },
    ];

    const csv = `Date,Description,Amount
2026-09-05,Swiggy,1450
2026-09-06,Airtel Broadband,999`;

    const result = parseTransactionCSV(csv, existing);
    expect(result.validTransactions.length).toBe(1);
    expect(result.duplicateCount).toBe(1);
    expect(result.validTransactions[0].amount).toBe(999);
  });

  it('reports errors for malformed or unparseable rows', () => {
    const csv = `Date,Description,Amount
invalid-date,Coffee Shop,not-a-number
2026-09-12,Zomato,850`;

    const result = parseTransactionCSV(csv);
    expect(result.errors.length).toBe(1);
    expect(result.validTransactions.length).toBe(1);
  });
});
