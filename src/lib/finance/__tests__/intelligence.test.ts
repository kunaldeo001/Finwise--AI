import { describe, it, expect } from 'vitest';
import {
  detectSubscriptions,
  detectUnusualSpending,
  generateSpendingIntelligence,
  autoCategorizeTransaction,
} from '../intelligence';
import { simulateFinancialScenario, calculateGoalMetrics } from '../calculations';
import { Transaction, FinancialGoal } from '../../types/finance';

describe('Financial Intelligence Engine Tests', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      userId: 'user-1',
      amount: 649,
      type: 'expense',
      category: 'Subscriptions',
      merchant: 'Netflix',
      date: '2026-09-01',
      isRecurring: true,
      paymentMethod: 'Credit Card',
      createdAt: '2026-09-01T00:00:00Z',
    },
    {
      id: 'tx-2',
      userId: 'user-1',
      amount: 119,
      type: 'expense',
      category: 'Subscriptions',
      merchant: 'Spotify India',
      date: '2026-09-05',
      isRecurring: true,
      paymentMethod: 'UPI',
      createdAt: '2026-09-05T00:00:00Z',
    },
    {
      id: 'tx-3',
      userId: 'user-1',
      amount: 850,
      type: 'expense',
      category: 'Food & Dining',
      merchant: 'Swiggy Delivery',
      date: '2026-09-08',
      isRecurring: false,
      paymentMethod: 'UPI',
      createdAt: '2026-09-08T00:00:00Z',
    },
    {
      id: 'tx-4',
      userId: 'user-1',
      amount: 920,
      type: 'expense',
      category: 'Food & Dining',
      merchant: 'Zomato Daily',
      date: '2026-09-12',
      isRecurring: false,
      paymentMethod: 'UPI',
      createdAt: '2026-09-12T00:00:00Z',
    },
    {
      id: 'tx-5',
      userId: 'user-1',
      amount: 6500,
      type: 'expense',
      category: 'Food & Dining',
      merchant: 'Luxury Michelin Bistro',
      date: '2026-09-15',
      isRecurring: false,
      paymentMethod: 'Credit Card',
      createdAt: '2026-09-15T00:00:00Z',
    },
  ];

  it('detectSubscriptions identifies recurring digital streaming subscriptions', () => {
    const result = detectSubscriptions(sampleTransactions);
    expect(result.subscriptions.length).toBeGreaterThanOrEqual(2);

    const netflix = result.subscriptions.find((s) => s.merchant.toLowerCase().includes('netflix'));
    expect(netflix).toBeDefined();
    expect(netflix?.monthlyAmount).toBe(649);

    const spotify = result.subscriptions.find((s) => s.merchant.toLowerCase().includes('spotify'));
    expect(spotify).toBeDefined();
    expect(spotify?.monthlyAmount).toBe(119);

    expect(result.totalMonthlyRecurring).toBe(649 + 119);
    expect(result.totalAnnualRecurring).toBe((649 + 119) * 12);
    expect(result.annualInsight).toContain('spending approximately ₹');
  });

  it('detectUnusualSpending flags expenses exceeding category averages by > 2.2x', () => {
    const anomalies = detectUnusualSpending(sampleTransactions);
    expect(anomalies.length).toBeGreaterThanOrEqual(1);

    const luxuryDine = anomalies.find((a) => a.transaction.merchant.includes('Michelin'));
    expect(luxuryDine).toBeDefined();
    expect(luxuryDine?.ratio).toBeGreaterThan(2);
    expect(luxuryDine?.reason).toContain('higher than your average');
  });

  it('autoCategorizeTransaction correctly maps common Indian merchants', () => {
    expect(autoCategorizeTransaction('Swiggy Order #123').category).toBe('Food & Dining');
    expect(autoCategorizeTransaction('Uber Ride Airport').category).toBe('Transportation');
    expect(autoCategorizeTransaction('Zerodha Broking SIP').category).toBe('Investments');
    expect(autoCategorizeTransaction('HDFC Home Loan EMI').category).toBe('Debt & EMI');
    expect(autoCategorizeTransaction('Tata Power Mumbai').category).toBe('Utilities');
  });

  it('generateSpendingIntelligence compares month-over-month variances', () => {
    const augustTx: Transaction = {
      id: 'tx-aug-1',
      userId: 'user-1',
      amount: 4000,
      type: 'expense',
      category: 'Food & Dining',
      merchant: 'Supermarket',
      date: '2026-08-15',
      isRecurring: false,
      paymentMethod: 'UPI',
      createdAt: '2026-08-15T00:00:00Z',
    };

    const intel = generateSpendingIntelligence([...sampleTransactions, augustTx], '2026-09', '2026-08');
    expect(intel.currentTotal).toBe(649 + 119 + 850 + 920 + 6500);
    expect(intel.previousTotal).toBe(4000);
    expect(intel.percentageChange).toBeGreaterThan(0);
  });

  it('simulateFinancialScenario models variable adjustments and net worth impact', () => {
    const simulation = simulateFinancialScenario({
      currentMonthlyIncome: 80000,
      currentMonthlyExpense: 50000,
      currentLiquidSavings: 100000,
      currentInvestments: 400000,
      currentDebts: 0,
      monthlyDebtEmi: 0,
      adjustments: {
        incomeChange: 0,
        expenseReduction: 5000,
        bigPurchaseAmount: 0,
        extraSipContribution: 3000,
        extraDebtPrepayment: 0,
        newLoanPrincipal: 0,
        newLoanTenureMonths: 0,
        newLoanRatePercent: 0,
      },
    });

    // Expenses reduced by 5,000, new net savings is 32,000 (after 3k extra SIP)
    expect(simulation.newNetSavings).toBe(32000);
    expect(simulation.newSavingsRate).toBe(40);
    expect(simulation.projectionPoints).toHaveLength(5);
    expect(simulation.netWorthDeltaAtYear5).toBeGreaterThan(0);
    expect(simulation.cashFlowImpactDescription).toContain('Surplus increases');
  });

  it('calculateGoalMetrics handles behind status with exact monthly shortfall', () => {
    const behindGoal: FinancialGoal = {
      id: 'goal-behind',
      userId: 'user-1',
      name: 'Emergency Reserve',
      targetAmount: 300000,
      currentAmount: 30000,
      monthlyContribution: 5000,
      targetDate: '2027-01-01', // very close target
      status: 'active',
      category: 'Emergency Fund',
      createdAt: '2026-01-01T00:00:00Z',
    };

    const metrics = calculateGoalMetrics(behindGoal);
    expect(['BEHIND', 'AT RISK']).toContain(metrics.status);
    expect(metrics.requiredMonthlySavings).toBeGreaterThan(behindGoal.monthlyContribution);
    expect(metrics.shortfallPerMonth).toBeGreaterThan(0);
  });

  it('generateSpendingIntelligence computes previous month deterministically without timezone shift', () => {
    const txs: Transaction[] = [
      {
        id: 'tx-sep',
        userId: 'u1',
        amount: 8400,
        type: 'expense',
        category: 'Food & Dining',
        merchant: 'Restaurants',
        date: '2026-09-10',
        createdAt: '2026-09-10T00:00:00Z',
      },
      {
        id: 'tx-aug',
        userId: 'u1',
        amount: 6800,
        type: 'expense',
        category: 'Food & Dining',
        merchant: 'Groceries',
        date: '2026-08-12',
        createdAt: '2026-08-12T00:00:00Z',
      },
    ];

    const result = generateSpendingIntelligence(txs, '2026-09');
    const food = result.categoryComparisons.find((c) => c.category === 'Food & Dining');
    expect(food).toBeDefined();
    expect(food?.currentAmount).toBe(8400);
    expect(food?.previousAmount).toBe(6800);
    expect(food?.percentageChange).toBe(24);
  });
});
