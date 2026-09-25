import { describe, it, expect } from 'vitest';
import { generateProvenance, generateSuggestedActions } from '../provenance';
import { Transaction } from '@/lib/types/finance';

describe('AI Data Provenance & Action Suggestions Tests', () => {
  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      userId: 'u1',
      amount: 4500,
      type: 'expense',
      category: 'Food & Dining',
      merchant: 'Swiggy',
      date: '2026-08-15',
      createdAt: '2026-08-15T00:00:00Z',
    },
    {
      id: 'tx-2',
      userId: 'u1',
      amount: 6500,
      type: 'expense',
      category: 'Food & Dining',
      merchant: 'Zomato',
      date: '2026-09-10',
      createdAt: '2026-09-10T00:00:00Z',
    },
    {
      id: 'tx-3',
      userId: 'u1',
      amount: 80000,
      type: 'income',
      category: 'Salary',
      merchant: 'Acme Corp',
      date: '2026-09-01',
      createdAt: '2026-09-01T00:00:00Z',
    },
  ];

  it('generateProvenance accurately computes transaction volume, period, and category scope', () => {
    const prov = generateProvenance(transactions);
    expect(prov.transactionsCount).toBe(3);
    expect(prov.totalExpensesAnalyzed).toBe(11000);
    expect(prov.totalIncomeAnalyzed).toBe(80000);
    expect(prov.categoriesCovered).toContain('Food & Dining');
    expect(prov.categoriesCovered).toContain('Salary');
  });

  it('generateProvenance respects category filters', () => {
    const foodProv = generateProvenance(transactions, 'Food & Dining');
    expect(foodProv.transactionsCount).toBe(2);
    expect(foodProv.totalExpensesAnalyzed).toBe(11000);
    expect(foodProv.totalIncomeAnalyzed).toBe(0);
  });

  it('generateSuggestedActions maps financial intent to actionable routes', () => {
    const foodActions = generateSuggestedActions('How can I reduce food spend?', 'Your food budget may be exceeded.');
    expect(foodActions.some((a) => a.route === '/budgets')).toBe(true);

    const goalActions = generateSuggestedActions('Is my emergency fund on track?', 'You are behind on your emergency fund.');
    expect(goalActions.some((a) => a.route === '/goals')).toBe(true);

    const simActions = generateSuggestedActions('What if I save 5000 more?', 'Simulating this change.');
    expect(simActions.some((a) => a.route === '/simulator')).toBe(true);

    const subActions = generateSuggestedActions('Show my subscriptions', 'Active Netflix subscription detected.');
    expect(subActions.some((a) => a.route === '/subscriptions')).toBe(true);
  });
});
