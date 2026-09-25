import { describe, it, expect } from 'vitest';
import {
  calculateEMI,
  calculateDebtPayoff,
  calculateGoalMetrics,
  calculateBudgetStatus,
  calculateNetWorth,
  calculateFinancialHealthScore,
  generateCashFlowForecast,
} from '../calculations';
import { FinancialGoal, Budget, Transaction, Investment, DebtItem } from '@/lib/types/finance';

describe('Financial Calculations Engine', () => {
  describe('calculateEMI', () => {
    it('calculates accurate monthly EMI for a standard loan', () => {
      // 10 Lakhs at 8.5% for 60 months
      const emi = calculateEMI(1000000, 8.5, 60);
      expect(emi).toBe(20517);
    });

    it('handles zero or negative inputs gracefully', () => {
      expect(calculateEMI(0, 8.5, 60)).toBe(0);
      expect(calculateEMI(100000, 0, 10)).toBe(10000);
      expect(calculateEMI(100000, 8.5, 0)).toBe(0);
    });
  });

  describe('calculateDebtPayoff', () => {
    it('calculates months and interest saved with extra monthly prepayment', () => {
      const principal = 500000;
      const rate = 9.0;
      const baseEmi = 10379; // ~60 months
      const extraPayment = 3000;

      const result = calculateDebtPayoff(principal, rate, baseEmi, extraPayment);

      expect(result.acceleratedMonths).toBeLessThan(result.baseMonths);
      expect(result.monthsSaved).toBeGreaterThan(0);
      expect(result.interestSaved).toBeGreaterThan(0);
      expect(result.acceleratedTotalInterest).toBeLessThan(result.baseTotalInterest);
    });

    it('returns zero savings when extra payment is 0', () => {
      const result = calculateDebtPayoff(200000, 10, 5000, 0);
      expect(result.monthsSaved).toBe(0);
      expect(result.interestSaved).toBe(0);
    });
  });

  describe('calculateGoalMetrics', () => {
    it('calculates on-track status when contribution is sufficient', () => {
      // Target date 10 months from now
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 10);

      const goal: FinancialGoal = {
        id: '1',
        userId: 'u1',
        name: 'Laptop',
        targetAmount: 100000,
        currentAmount: 20000,
        targetDate: futureDate.toISOString().substring(0, 10),
        monthlyContribution: 10000,
        category: 'Laptop',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      const metrics = calculateGoalMetrics(goal);
      expect(metrics.progressPercentage).toBe(20);
      expect(metrics.remainingAmount).toBe(80000);
      expect(metrics.isOnTrack).toBe(true);
      expect(metrics.shortfallPerMonth).toBe(0);
    });

    it('calculates shortfall when contribution is lagging', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 5);

      const goal: FinancialGoal = {
        id: '2',
        userId: 'u1',
        name: 'Vacation',
        targetAmount: 50000,
        currentAmount: 0,
        targetDate: futureDate.toISOString().substring(0, 10),
        monthlyContribution: 2000, // Needs 10,000/mo
        category: 'Travel',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      const metrics = calculateGoalMetrics(goal);
      expect(metrics.isOnTrack).toBe(false);
      expect(metrics.shortfallPerMonth).toBeGreaterThan(0);
    });
  });

  describe('calculateBudgetStatus', () => {
    it('computes spent, remaining, and alert statuses accurately', () => {
      const currentMonth = new Date().toISOString().substring(0, 7);
      const budgets: Budget[] = [
        { id: 'b1', userId: 'u1', category: 'Food & Dining', limit: 10000, period: 'monthly', alertThresholdPercent: 80 },
        { id: 'b2', userId: 'u1', category: 'Transport', limit: 5000, period: 'monthly', alertThresholdPercent: 75 },
      ];

      const transactions: Transaction[] = [
        {
          id: 't1',
          userId: 'u1',
          amount: 8500,
          type: 'expense',
          category: 'Food & Dining',
          merchant: 'Swiggy',
          date: `${currentMonth}-05`,
          createdAt: new Date().toISOString(),
        },
        {
          id: 't2',
          userId: 'u1',
          amount: 2000,
          type: 'expense',
          category: 'Transport',
          merchant: 'Uber',
          date: `${currentMonth}-06`,
          createdAt: new Date().toISOString(),
        },
      ];

      const statuses = calculateBudgetStatus(budgets, transactions, currentMonth);

      expect(statuses[0].spent).toBe(8500);
      expect(statuses[0].remaining).toBe(1500);
      expect(statuses[0].percentage).toBe(85);
      expect(statuses[0].status).toBe('warning'); // >= 80% threshold

      expect(statuses[1].spent).toBe(2000);
      expect(statuses[1].remaining).toBe(3000);
      expect(statuses[1].isOverBudget).toBe(false);
    });
  });

  describe('calculateNetWorth', () => {
    it('correctly calculates assets minus liabilities', () => {
      const investments: Investment[] = [
        {
          id: 'i1',
          userId: 'u1',
          symbol: 'TCS',
          name: 'TCS',
          assetType: 'stocks',
          quantity: 10,
          buyPrice: 3000,
          currentPrice: 3500,
          investedAmount: 30000,
          currentValue: 35000,
          returnAmount: 5000,
          returnPercentage: 16.6,
        },
      ];

      const debts: DebtItem[] = [
        {
          id: 'd1',
          userId: 'u1',
          name: 'Car Loan',
          principal: 200000,
          interestRate: 9,
          tenureMonths: 36,
          emi: 6360,
          remainingBalance: 150000,
          startDate: '2025-01-01',
          category: 'Car Loan',
        },
      ];

      const liquidSavings = 50000;
      const result = calculateNetWorth(investments, debts, liquidSavings);

      expect(result.totalAssets).toBe(85000); // 35000 + 50000
      expect(result.totalLiabilities).toBe(150000);
      expect(result.netWorth).toBe(-65000);
    });
  });

  describe('calculateFinancialHealthScore', () => {
    it('produces a transparent score between 0 and 100 with 5 factors', () => {
      const score = calculateFinancialHealthScore({
        monthlyIncome: 100000,
        monthlyExpense: 50000,
        monthlyDebtEmi: 15000,
        liquidSavings: 300000,
        budgets: [],
        transactions: [],
        goals: [],
      });

      expect(score.overallScore).toBeGreaterThanOrEqual(0);
      expect(score.overallScore).toBeLessThanOrEqual(100);
      expect(score.factors.savingsRate.score).toBeGreaterThan(0);
      expect(score.factors.emergencyFundCoverage.score).toBeGreaterThan(0);
      expect(score.rating).toBeDefined();
    });
  });

  describe('generateCashFlowForecast', () => {
    it('forecasts 30-day balance, income, and expenses', () => {
      const forecast = generateCashFlowForecast({
        currentBalance: 50000,
        monthlyIncome: 90000,
        monthlyExpense: 60000,
        days: 30,
      });

      expect(forecast.days).toBe(30);
      expect(forecast.expectedIncome).toBeGreaterThan(0);
      expect(forecast.expectedExpenses).toBeGreaterThan(0);
      expect(forecast.projectedBalance).toBeGreaterThan(50000);
      expect(forecast.points.length).toBeGreaterThan(0);
    });
  });
});
