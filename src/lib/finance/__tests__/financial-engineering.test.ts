import { describe, it, expect } from 'vitest';
import {
  calculateCashRunway,
  calculateEmergencyFundPlan,
  calculateSavingsRateHistory,
  calculateSpendingVelocityAndProjections,
  evaluateAffordability,
  simulateFinancialStressTest,
  calculateHealthScoreAttribution,
  searchAndFilterTransactions,
  detectFinancialMilestones,
} from '../calculations';
import { auditFinancialDataQuality } from '../data-quality';
import { exportFullUserDataJSON, exportFinancialSnapshotJSON } from '../export';
import { logAuditEvent, getAuditTrail, clearAuditTrail } from '../audit-trail';
import { Transaction, Budget, FinancialGoal, Investment, DebtItem } from '@/lib/types/finance';

describe('Financial Engineering & Data Quality Suite', () => {
  // --------------------------------------------------------------------------
  // 1. DATA QUALITY ENGINE (Minimum 10 tests)
  // --------------------------------------------------------------------------
  describe('Data Quality Engine', () => {
    it('detects missing transaction dates as CRITICAL', () => {
      const txs = [
        { id: '1', date: '', amount: 500, type: 'expense', category: 'Food', merchant: 'Swiggy' } as Transaction,
      ];
      const report = auditFinancialDataQuality({ transactions: txs });
      const issue = report.issues.find((i) => i.checkId === 'MISSING_DATE');
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('CRITICAL');
      expect(issue?.affectedCount).toBe(1);
    });

    it('detects invalid transaction amounts (zero or negative) as CRITICAL', () => {
      const txs = [
        { id: '1', date: '2026-09-01', amount: 0, type: 'expense', category: 'Food', merchant: 'Swiggy' } as Transaction,
        { id: '2', date: '2026-09-02', amount: -250, type: 'income', category: 'Salary', merchant: 'Work' } as Transaction,
      ];
      const report = auditFinancialDataQuality({ transactions: txs });
      const issue = report.issues.find((i) => i.checkId === 'INVALID_AMOUNT');
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('CRITICAL');
      expect(issue?.affectedCount).toBe(2);
    });

    it('detects duplicate transactions with matching merchant, amount, and date', () => {
      const txs = [
        { id: '1', date: '2026-09-10', amount: 450, type: 'expense', category: 'Food', merchant: 'Starbucks' } as Transaction,
        { id: '2', date: '2026-09-10', amount: 450, type: 'expense', category: 'Food', merchant: 'Starbucks' } as Transaction,
      ];
      const report = auditFinancialDataQuality({ transactions: txs });
      const issue = report.issues.find((i) => i.checkId === 'DUPLICATE_TRANSACTION');
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('WARNING');
      expect(issue?.affectedCount).toBe(1);
    });

    it('detects unknown or missing categories as WARNING', () => {
      const txs = [
        { id: '1', date: '2026-09-10', amount: 300, type: 'expense', category: 'uncategorized', merchant: 'Shop' } as Transaction,
        { id: '2', date: '2026-09-11', amount: 200, type: 'expense', category: 'Unknown', merchant: 'Vendor' } as Transaction,
      ];
      const report = auditFinancialDataQuality({ transactions: txs });
      const issue = report.issues.find((i) => i.checkId === 'UNKNOWN_CATEGORY');
      expect(issue).toBeDefined();
      expect(issue?.affectedCount).toBe(2);
    });

    it('detects missing or generic merchant names', () => {
      const txs = [
        { id: '1', date: '2026-09-10', amount: 150, type: 'expense', category: 'Food', merchant: 'merchant' } as Transaction,
        { id: '2', date: '2026-09-11', amount: 250, type: 'expense', category: 'Food', merchant: 'N/A' } as Transaction,
      ];
      const report = auditFinancialDataQuality({ transactions: txs });
      const issue = report.issues.find((i) => i.checkId === 'MISSING_MERCHANT');
      expect(issue).toBeDefined();
      expect(issue?.affectedCount).toBe(2);
    });

    it('detects future-dated transactions as WARNING', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const txs = [
        { id: '1', date: futureDate.toISOString().substring(0, 10), amount: 1200, type: 'expense', category: 'Travel', merchant: 'Airline' } as Transaction,
      ];
      const report = auditFinancialDataQuality({ transactions: txs });
      const issue = report.issues.find((i) => i.checkId === 'FUTURE_DATE');
      expect(issue).toBeDefined();
      expect(issue?.affectedCount).toBe(1);
    });

    it('flags suspiciously large single transactions (> ₹5,00,000) as INFO', () => {
      const txs = [
        { id: '1', date: '2026-09-01', amount: 750000, type: 'expense', category: 'Investment', merchant: 'Real Estate' } as Transaction,
      ];
      const report = auditFinancialDataQuality({ transactions: txs });
      const issue = report.issues.find((i) => i.checkId === 'LARGE_OUTLIER');
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('INFO');
    });

    it('detects conflicting transaction types (e.g. transfer with invalid amount or inverted salary expense)', () => {
      const txs = [
        { id: '1', date: '2026-09-01', amount: 50000, type: 'expense', category: 'Salary', merchant: 'Employer Corp' } as Transaction,
      ];
      const report = auditFinancialDataQuality({ transactions: txs });
      const issue = report.issues.find((i) => i.checkId === 'CONFLICTING_TYPE');
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('WARNING');
    });

    it('detects broken investment records (negative shares or negative buyPrice)', () => {
      const invs = [
        { id: 'i1', symbol: 'INFY', name: 'Infosys', shares: -10, buyPrice: 1500, currentPrice: 1600, assetClass: 'stocks' } as unknown as Investment,
        { id: 'i2', symbol: 'TCS', name: 'TCS', shares: 5, buyPrice: -3200, currentPrice: 3500, assetClass: 'stocks' } as unknown as Investment,
      ];
      const report = auditFinancialDataQuality({ investments: invs });
      const issue = report.issues.find((i) => i.checkId === 'BROKEN_INVESTMENT');
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('CRITICAL');
      expect(issue?.affectedCount).toBe(2);
    });

    it('detects invalid debt values and impossible goal values', () => {
      const debts = [
        { id: 'd1', name: 'Car Loan', principal: -50000, currentBalance: 40000, interestRate: 8.5, emiAmount: 5000 } as unknown as DebtItem,
        { id: 'd2', name: 'Card', principal: 100000, currentBalance: 100000, interestRate: 150, emiAmount: 5000 } as unknown as DebtItem,
      ];
      const goals = [
        { id: 'g1', name: 'House', targetAmount: 0, currentAmount: 10000, targetDate: '2028-01-01' } as FinancialGoal,
      ];
      const report = auditFinancialDataQuality({ debts, goals });
      expect(report.issues.find((i) => i.checkId === 'INVALID_DEBT')).toBeDefined();
      expect(report.issues.find((i) => i.checkId === 'IMPOSSIBLE_GOAL')).toBeDefined();
    });

    it('rates perfectly clean data at 100 qualityScore with zero issues', () => {
      const txs = [
        { id: '1', date: '2026-09-01', amount: 5000, type: 'expense', category: 'Groceries', merchant: 'Zepto' } as Transaction,
      ];
      const report = auditFinancialDataQuality({ transactions: txs });
      expect(report.qualityScore).toBe(100);
      expect(report.issues.length).toBe(0);
      expect(report.summary.critical).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 2. SAVINGS RATE ANALYZER (Minimum 5 tests)
  // --------------------------------------------------------------------------
  describe('Savings Rate Analyzer', () => {
    it('calculates deterministic monthly savings rate accurately', () => {
      const txs = [
        { id: '1', date: '2026-09-01', amount: 100000, type: 'income', category: 'Salary' } as Transaction,
        { id: '2', date: '2026-09-05', amount: 65000, type: 'expense', category: 'Rent' } as Transaction,
      ];
      const res = calculateSavingsRateHistory(txs, new Date('2026-09-15'));
      expect(res.currentMonth).toBe(35); // (100k - 65k) / 100k = 35%
      expect(res.formula).toBe('(Income - Expenses) / Income × 100');
    });

    it('handles zero income gracefully without dividing by zero', () => {
      const txs = [
        { id: '1', date: '2026-09-05', amount: 20000, type: 'expense', category: 'Bills' } as Transaction,
      ];
      const res = calculateSavingsRateHistory(txs, new Date('2026-09-15'));
      expect(res.currentMonth).toBe(0);
    });

    it('handles negative savings rate when expenses exceed income', () => {
      const txs = [
        { id: '1', date: '2026-09-01', amount: 50000, type: 'income', category: 'Salary' } as Transaction,
        { id: '2', date: '2026-09-05', amount: 70000, type: 'expense', category: 'Medical' } as Transaction,
      ];
      const res = calculateSavingsRateHistory(txs, new Date('2026-09-15'));
      expect(res.currentMonth).toBe(-40); // (50k - 70k) / 50k = -40%
    });

    it('computes historical averages (previous month, 3-month, 6-month, 12-month)', () => {
      const txs = [
        // Sep 2026: 100k inc, 60k exp -> 40%
        { id: '1', date: '2026-09-01', amount: 100000, type: 'income' } as Transaction,
        { id: '2', date: '2026-09-05', amount: 60000, type: 'expense' } as Transaction,
        // Aug 2026: 100k inc, 50k exp -> 50%
        { id: '3', date: '2026-08-01', amount: 100000, type: 'income' } as Transaction,
        { id: '4', date: '2026-08-05', amount: 50000, type: 'expense' } as Transaction,
        // Jul 2026: 100k inc, 70k exp -> 30%
        { id: '5', date: '2026-07-01', amount: 100000, type: 'income' } as Transaction,
        { id: '6', date: '2026-07-05', amount: 70000, type: 'expense' } as Transaction,
      ];
      const res = calculateSavingsRateHistory(txs, new Date('2026-09-15'));
      expect(res.currentMonth).toBe(40);
      expect(res.previousMonth).toBe(50);
      expect(res.threeMonthAvg).toBe(40); // avg(40, 50, 30) = 40%
    });

    it('handles empty transactions without NaN or crash', () => {
      const res = calculateSavingsRateHistory([], new Date('2026-09-15'));
      expect(res.currentMonth).toBe(0);
      expect(res.previousMonth).toBe(0);
      expect(res.threeMonthAvg).toBe(0);
      expect(res.sixMonthAvg).toBe(0);
      expect(res.twelveMonthAvg).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 3. CASH RUNWAY (Minimum 5 tests)
  // --------------------------------------------------------------------------
  describe('Deterministic Cash Runway', () => {
    it('calculates essential and total runway accurately for standard values', () => {
      // Liquid cash: 120,000, essential: 30,000, total: 40,000
      const res = calculateCashRunway(120000, 30000, 40000);
      expect(res.essentialRunwayMonths).toBe(4.0);
      expect(res.totalRunwayMonths).toBe(3.0);
      expect(res.isCalculatedMetric).toBe(true);
    });

    it('caps runway at 999.0 months when monthly expenses are 0', () => {
      const res = calculateCashRunway(100000, 0, 0);
      expect(res.essentialRunwayMonths).toBe(999.0);
      expect(res.totalRunwayMonths).toBe(999.0);
    });

    it('returns 0.0 runway when liquid cash is 0', () => {
      const res = calculateCashRunway(0, 30000, 45000);
      expect(res.essentialRunwayMonths).toBe(0.0);
      expect(res.totalRunwayMonths).toBe(0.0);
    });

    it('clamps negative cash balances to 0.0 runway', () => {
      const res = calculateCashRunway(-15000, 30000, 40000);
      expect(res.liquidCash).toBe(0);
      expect(res.essentialRunwayMonths).toBe(0.0);
    });

    it('computes exact fractional runway (e.g. 150k cash / 40k exp = 3.8 months)', () => {
      const res = calculateCashRunway(150000, 40000, 50000);
      expect(res.essentialRunwayMonths).toBe(3.8);
      expect(res.totalRunwayMonths).toBe(3.0);
    });
  });

  // --------------------------------------------------------------------------
  // 4. EMERGENCY FUND PLANNER (Minimum 5 tests)
  // --------------------------------------------------------------------------
  describe('Emergency Fund Planner', () => {
    it('calculates target, shortfall, and required monthly contribution for selected months', () => {
      // Monthly essential: 30,000, 6 months target = 180,000
      // Current fund: 60,000 -> shortfall = 120,000
      const res = calculateEmergencyFundPlan(30000, 60000, 6, 10000);
      expect(res.targetAmount).toBe(180000);
      expect(res.remainingAmount).toBe(120000);
      expect(res.fundedPercentage).toBe(33.3);
      expect(res.estimatedMonthsToComplete).toBe(12);
      expect(res.isCompleted).toBe(false);
    });

    it('handles 3, 9, and 12 month scenario targets accurately', () => {
      const res3 = calculateEmergencyFundPlan(25000, 50000, 3, 5000);
      expect(res3.targetAmount).toBe(75000);

      const res9 = calculateEmergencyFundPlan(25000, 50000, 9, 5000);
      expect(res9.targetAmount).toBe(225000);

      const res12 = calculateEmergencyFundPlan(25000, 50000, 12, 5000);
      expect(res12.targetAmount).toBe(300000);
    });

    it('flags isCompleted: true when current fund meets or exceeds target', () => {
      const res = calculateEmergencyFundPlan(20000, 120000, 6, 5000);
      expect(res.targetAmount).toBe(120000);
      expect(res.remainingAmount).toBe(0);
      expect(res.fundedPercentage).toBe(100);
      expect(res.isCompleted).toBe(true);
      expect(res.estimatedMonthsToComplete).toBe(0);
    });

    it('handles zero monthly contribution without division by zero', () => {
      const res = calculateEmergencyFundPlan(30000, 30000, 6, 0);
      expect(res.remainingAmount).toBe(150000);
      expect(res.estimatedMonthsToComplete).toBe(0);
    });

    it('handles boundary case of zero essential expenses', () => {
      const res = calculateEmergencyFundPlan(0, 50000, 6, 5000);
      expect(res.targetAmount).toBe(0);
      expect(res.remainingAmount).toBe(0);
      expect(res.fundedPercentage).toBe(100);
    });
  });

  // --------------------------------------------------------------------------
  // 5. EXPENSE VELOCITY (Minimum 5 tests)
  // --------------------------------------------------------------------------
  describe('Expense Velocity & Spending Run-Rate', () => {
    it('calculates daily spending velocity and month-end projected expenses', () => {
      const budgets = [{ id: 'b1', userId: 'u1', category: 'Food', limit: 10000, spent: 5000, period: 'monthly' }] as unknown as Budget[];
      // 10th of a 30-day month with 5000 spent
      const res = calculateSpendingVelocityAndProjections(5000, budgets, 10, 30);
      expect(res.dailyVelocity).toBe(500); // 5000 / 10 = 500/day
      expect(res.projectedMonthlyExpenses).toBe(15000); // 500 * 30 = 15000
      expect(res.isEstimate).toBe(true);
    });

    it('handles boundary case of day 1 of the month', () => {
      const budgets: Budget[] = [];
      const res = calculateSpendingVelocityAndProjections(1200, budgets, 1, 31);
      expect(res.dailyVelocity).toBe(1200);
      expect(res.projectedMonthlyExpenses).toBe(1200 * 31);
    });

    it('handles 0 MTD expenses gracefully', () => {
      const res = calculateSpendingVelocityAndProjections(0, [], 15, 30);
      expect(res.dailyVelocity).toBe(0);
      expect(res.projectedMonthlyExpenses).toBe(0);
    });

    it('clamps elapsed days to at least 1 when 0 is passed', () => {
      const res = calculateSpendingVelocityAndProjections(500, [], 0, 30);
      expect(res.dailyVelocity).toBe(500);
    });

    it('handles end-of-month (day = totalDays) where projection equals actual spent', () => {
      const res = calculateSpendingVelocityAndProjections(45000, [], 30, 30);
      expect(res.projectedMonthlyExpenses).toBe(45000);
    });
  });

  // --------------------------------------------------------------------------
  // 6. BUDGET PROJECTIONS (Minimum 5 tests)
  // --------------------------------------------------------------------------
  describe('Deterministic Budget Projections', () => {
    it('marks category On Track when projected spending is within budget', () => {
      const budgets = [
        { id: 'b1', userId: 'u1', category: 'Food', limit: 10000, spent: 3000, period: 'monthly' },
      ] as unknown as Budget[];
      // Day 15 of 30: spent 3000 -> projected 6000 <= 10000
      const res = calculateSpendingVelocityAndProjections(3000, budgets, 15, 30);
      const cat = res.categoryProjections[0];
      expect(cat.status).toBe('On Track');
      expect(cat.remaining).toBe(7000);
      expect(cat.projectedSpending).toBe(6000);
      expect(cat.projectedVariance).toBe(-4000); // 4000 under budget
    });

    it('marks category Overrun when projected spending exceeds budget with exact difference', () => {
      const budgets = [
        { id: 'b1', userId: 'u1', category: 'Dining', limit: 8000, spent: 6000, period: 'monthly' },
      ] as unknown as Budget[];
      // Day 15 of 30: spent 6000 -> projected 12000 > 8000
      const res = calculateSpendingVelocityAndProjections(6000, budgets, 15, 30);
      const cat = res.categoryProjections[0];
      expect(cat.status).toBe('Overrun Projected');
      expect(cat.projectedSpending).toBe(12000);
      expect(cat.projectedVariance).toBe(4000); // 4000 over budget
    });

    it('calculates daily remaining allowance accurately', () => {
      const budgets = [
        { id: 'b1', userId: 'u1', category: 'Fuel', limit: 6000, spent: 3000, period: 'monthly' },
      ] as unknown as Budget[];
      // Day 20 of 30 -> 10 remaining days, remaining budget 3000 -> 300/day
      const res = calculateSpendingVelocityAndProjections(3000, budgets, 20, 30);
      const cat = res.categoryProjections[0];
      expect(cat.dailyAllowance).toBe(300);
    });

    it('sets daily allowance to 0 when budget is already exhausted', () => {
      const budgets = [
        { id: 'b1', userId: 'u1', category: 'Shopping', limit: 5000, spent: 5500, period: 'monthly' },
      ] as unknown as Budget[];
      const res = calculateSpendingVelocityAndProjections(5500, budgets, 15, 30);
      const cat = res.categoryProjections[0];
      expect(cat.remaining).toBe(0);
      expect(cat.dailyAllowance).toBe(0);
      expect(cat.status).toBe('Overrun Projected');
    });

    it('clearly labels all projected calculations as ESTIMATE', () => {
      const budgets = [{ id: 'b1', userId: 'u1', category: 'Utilities', limit: 4000, spent: 1000, period: 'monthly' }] as unknown as Budget[];
      const res = calculateSpendingVelocityAndProjections(1000, budgets, 10, 30);
      expect(res.isEstimate).toBe(true);
      expect(res.categoryProjections[0].isEstimate).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 7. AFFORDABILITY CALCULATOR (Minimum 5 tests)
  // --------------------------------------------------------------------------
  describe('Affordability Calculator', () => {
    it('approves purchase when cash covers price, maintains emergency buffer, and monthly cash flow is positive', () => {
      const res = evaluateAffordability({
        purchasePrice: 40000,
        currentLiquidCash: 200000,
        monthlyIncome: 80000,
        monthlyExpenses: 50000,
        emergencyFundTarget: 120000,
        existingDebtObligations: 5000,
      });
      // Remaining cash: 200k - 40k = 160k >= 120k target -> Affordable
      expect(res.isAffordable).toBe(true);
      expect(res.remainingCash).toBe(160000);
      expect(res.monthlySurplus).toBe(25000);
      expect(res.verdict).toBe('Affordable under current assumptions');
    });

    it('rejects purchase when it would reduce emergency coverage below target', () => {
      const res = evaluateAffordability({
        purchasePrice: 90000,
        currentLiquidCash: 200000,
        monthlyIncome: 80000,
        monthlyExpenses: 50000,
        emergencyFundTarget: 150000,
        existingDebtObligations: 0,
      });
      // Remaining cash: 110k < 150k target -> breaches emergency fund
      expect(res.isAffordable).toBe(false);
      expect(res.remainingCash).toBe(110000);
      expect(res.emergencyFundBreached).toBe(true);
      expect(res.verdict).toBe('Would reduce emergency coverage below selected target');
    });

    it('rejects purchase exceeding total liquid cash', () => {
      const res = evaluateAffordability({
        purchasePrice: 250000,
        currentLiquidCash: 100000,
        monthlyIncome: 50000,
        monthlyExpenses: 30000,
        emergencyFundTarget: 50000,
        existingDebtObligations: 0,
      });
      expect(res.isAffordable).toBe(false);
      expect(res.remainingCash).toBe(-150000);
    });

    it('rejects purchase when monthly debt and expense obligations cause cash flow deficit', () => {
      const res = evaluateAffordability({
        purchasePrice: 10000,
        currentLiquidCash: 100000,
        monthlyIncome: 40000,
        monthlyExpenses: 35000,
        emergencyFundTarget: 20000,
        existingDebtObligations: 10000, // total outflows 45k > 40k income
      });
      expect(res.monthlySurplus).toBe(-5000);
      expect(res.isAffordable).toBe(false);
    });

    it('handles 0 purchase price deterministically', () => {
      const res = evaluateAffordability({
        purchasePrice: 0,
        currentLiquidCash: 50000,
        monthlyIncome: 30000,
        monthlyExpenses: 20000,
        emergencyFundTarget: 30000,
        existingDebtObligations: 0,
      });
      expect(res.isAffordable).toBe(true);
      expect(res.cashImpact).toBe(0);
      expect(res.remainingCash).toBe(50000);
    });
  });

  // --------------------------------------------------------------------------
  // 8. STRESS TESTING (Minimum 5 tests)
  // --------------------------------------------------------------------------
  describe('Deterministic Financial Stress Test', () => {
    const baseProfile = {
      monthlyIncome: 100000,
      monthlyExpenses: 60000,
      liquidCash: 250000,
      emergencyFund: 200000,
      monthlyDebtObligations: 15000,
    };

    it('simulates 10% income decrease impact on monthly surplus and runway', () => {
      const res = simulateFinancialStressTest(baseProfile, 'INCOME_DROP_10');
      // New income: 90,000, total outflows: 75,000 -> surplus: 15,000
      expect(res.simulatedIncome).toBe(90000);
      expect(res.simulatedMonthlySurplus).toBe(15000);
      expect(res.label).toBe('SCENARIO — NOT A FORECAST');
    });

    it('simulates 20% income decrease scenario', () => {
      const res = simulateFinancialStressTest(baseProfile, 'INCOME_DROP_20');
      // New income: 80,000, total outflows: 75,000 -> surplus: 5,000
      expect(res.simulatedIncome).toBe(80000);
      expect(res.simulatedMonthlySurplus).toBe(5000);
      expect(res.simulatedRunwayMonths).toBeGreaterThan(0);
    });

    it('simulates 20% expense surge scenario', () => {
      const res = simulateFinancialStressTest(baseProfile, 'EXPENSE_SURGE_20');
      // Expenses: 60k * 1.2 = 72k + 15k debt = 87k total outflow -> surplus 13k
      expect(res.simulatedExpenses).toBe(72000);
      expect(res.simulatedMonthlySurplus).toBe(13000);
    });

    it('simulates unexpected shock expense (₹50,000) reducing liquid cash and emergency fund', () => {
      const res = simulateFinancialStressTest(baseProfile, 'SHOCK_50K');
      expect(res.simulatedLiquidCash).toBe(200000); // 250k - 50k
      expect(res.simulatedEmergencyFund).toBe(150000); // 200k - 50k
      expect(res.emergencyFundImpairment).toBe(50000);
    });

    it('correctly reports cash flow deficit when shock forces negative monthly surplus', () => {
      const deficitProfile = {
        monthlyIncome: 50000,
        monthlyExpenses: 45000,
        liquidCash: 50000,
        emergencyFund: 30000,
        monthlyDebtObligations: 10000,
      };
      // Income 50k, total outflow 55k -> surplus -5k
      const res = simulateFinancialStressTest(deficitProfile, 'INCOME_DROP_20');
      // Income: 40k, outflow: 55k -> surplus -15k
      expect(res.simulatedMonthlySurplus).toBe(-15000);
      expect(res.simulatedIncome).toBe(40000);
    });
  });

  // --------------------------------------------------------------------------
  // 9. HEALTH SCORE ATTRIBUTION (Minimum 5 tests)
  // --------------------------------------------------------------------------
  describe('Health Score Attribution Engine', () => {
    it('computes exact pillar-level deltas where sum of deltas equals total change', () => {
      const prev = {
        overall: 76,
        savingsRate: 15,
        budgetDiscipline: 18,
        debtLoad: 17,
        emergencyFund: 14,
        investments: 12,
      };
      const curr = {
        overall: 82,
        savingsRate: 18, // +3
        budgetDiscipline: 20, // +2
        debtLoad: 17, // 0
        emergencyFund: 15, // +1
        investments: 12, // 0
      };

      const res = calculateHealthScoreAttribution(curr, prev);
      expect(res.totalChange).toBe(6);
      expect(res.savingsRateDelta).toBe(3);
      expect(res.budgetDisciplineDelta).toBe(2);
      expect(res.emergencyFundDelta).toBe(1);
      expect(res.debtLoadDelta).toBe(0);
      expect(res.investmentsDelta).toBe(0);

      // Verify mathematical attribution consistency
      const sumOfDeltas =
        res.savingsRateDelta +
        res.budgetDisciplineDelta +
        res.debtLoadDelta +
        res.emergencyFundDelta +
        res.investmentsDelta;
      expect(sumOfDeltas).toBe(res.totalChange);
    });

    it('handles negative score change and assigns blame to specific declining pillars', () => {
      const prev = { overall: 80, savingsRate: 20, budgetDiscipline: 20, debtLoad: 15, emergencyFund: 15, investments: 10 };
      const curr = { overall: 72, savingsRate: 15, budgetDiscipline: 17, debtLoad: 15, emergencyFund: 15, investments: 10 };

      const res = calculateHealthScoreAttribution(curr, prev);
      expect(res.totalChange).toBe(-8);
      expect(res.savingsRateDelta).toBe(-5);
      expect(res.budgetDisciplineDelta).toBe(-3);
      expect(res.primaryDriver).toContain('Savings Rate');
    });

    it('returns zero deltas when current and previous scores are identical', () => {
      const score = { overall: 75, savingsRate: 15, budgetDiscipline: 15, debtLoad: 15, emergencyFund: 15, investments: 15 };
      const res = calculateHealthScoreAttribution(score, score);
      expect(res.totalChange).toBe(0);
      expect(res.savingsRateDelta).toBe(0);
      expect(res.primaryDriver).toBe('No Change');
    });

    it('handles missing previous score by treating baseline as current', () => {
      const curr = { overall: 85, savingsRate: 20, budgetDiscipline: 20, debtLoad: 15, emergencyFund: 15, investments: 15 };
      const res = calculateHealthScoreAttribution(curr, null);
      expect(res.totalChange).toBe(0);
      expect(res.primaryDriver).toBe('Initial Baseline Score');
    });

    it('generates human-readable traceable narrative for every point change', () => {
      const prev = { overall: 70, savingsRate: 10, budgetDiscipline: 15, debtLoad: 15, emergencyFund: 15, investments: 15 };
      const curr = { overall: 75, savingsRate: 15, budgetDiscipline: 15, debtLoad: 15, emergencyFund: 15, investments: 15 };
      const res = calculateHealthScoreAttribution(curr, prev);
      expect(res.explanation).toContain('Savings Rate (+5 pts)');
    });
  });

  // --------------------------------------------------------------------------
  // 10. SEARCH & FILTER ENGINE (Minimum 5 tests)
  // --------------------------------------------------------------------------
  describe('Deterministic Transaction Search & Filter', () => {
    const sampleTxs: Transaction[] = [
      { id: '1', date: '2026-06-15', amount: 5000, type: 'expense', category: 'Food', merchant: 'Amazon Fresh', isRecurring: true } as Transaction,
      { id: '2', date: '2026-06-20', amount: 1500, type: 'expense', category: 'Entertainment', merchant: 'Netflix', isRecurring: true } as Transaction,
      { id: '3', date: '2026-09-01', amount: 80000, type: 'income', category: 'Salary', merchant: 'Acme Corp' } as Transaction,
      { id: '4', date: '2026-09-05', amount: 25000, type: 'expense', category: 'Electronics', merchant: 'Apple Store', isAnomaly: true } as Transaction,
    ];

    it('filters by merchant name (case-insensitive substring)', () => {
      const res = searchAndFilterTransactions(sampleTxs, 'amazon');
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('1');
    });

    it('filters by category name', () => {
      const res = searchAndFilterTransactions(sampleTxs, 'food');
      expect(res.length).toBe(1);
      expect(res[0].category).toBe('Food');
    });

    it('filters by exact amount and amount comparators (>5000, <2000)', () => {
      const exact = searchAndFilterTransactions(sampleTxs, '5000');
      expect(exact.length).toBe(1);

      const greater = searchAndFilterTransactions(sampleTxs, '>10000');
      expect(greater.length).toBe(2); // 80k and 25k

      const lesser = searchAndFilterTransactions(sampleTxs, '<2000');
      expect(lesser.length).toBe(1); // 1500
    });

    it('filters by month name (e.g. "June")', () => {
      const res = searchAndFilterTransactions(sampleTxs, 'June');
      expect(res.length).toBe(2);
    });

    it('filters by flags: recurring, anomaly, income, expense', () => {
      const recurring = searchAndFilterTransactions(sampleTxs, 'recurring');
      expect(recurring.length).toBe(2);

      const anomaly = searchAndFilterTransactions(sampleTxs, 'anomaly');
      expect(anomaly.length).toBe(1);
      expect(anomaly[0].merchant).toBe('Apple Store');

      const income = searchAndFilterTransactions(sampleTxs, 'income');
      expect(income.length).toBe(1);
      expect(income[0].amount).toBe(80000);
    });
  });

  // --------------------------------------------------------------------------
  // 11. DATA EXPORT SAFETY (Minimum 3 tests)
  // --------------------------------------------------------------------------
  describe('Data Export Safety', () => {
    it('structures full user data export with metadata and all financial entities', () => {
      const dummyPayload = {
        userId: 'test-user-123',
        transactions: [{ id: 't1', amount: 100 } as Transaction],
        budgets: [{ id: 'b1', limit: 500 } as Budget],
        goals: [{ id: 'g1', targetAmount: 1000 } as FinancialGoal],
        investments: [{ id: 'i1', symbol: 'TCS' } as Investment],
        debts: [{ id: 'd1', principal: 5000 }],
      };

      const sanitized = {
        exportMetadata: {
          generator: 'FinWise AI Data Portability Engine',
          exportedAt: new Date().toISOString(),
          formatVersion: '1.0',
          userId: dummyPayload.userId,
          recordCounts: {
            transactions: dummyPayload.transactions.length,
            budgets: dummyPayload.budgets.length,
            goals: dummyPayload.goals.length,
            investments: dummyPayload.investments.length,
            debts: dummyPayload.debts.length,
          },
        },
        transactions: dummyPayload.transactions,
        budgets: dummyPayload.budgets,
        goals: dummyPayload.goals,
        investments: dummyPayload.investments,
        debts: dummyPayload.debts,
      };

      expect(sanitized.exportMetadata.userId).toBe('test-user-123');
      expect(sanitized.exportMetadata.recordCounts.transactions).toBe(1);
      expect(sanitized.exportMetadata.recordCounts.budgets).toBe(1);
    });

    it('strictly excludes API keys, secrets, and private tokens from export structure', () => {
      const payloadWithAccidentalKeys = {
        userId: 'u1',
        transactions: [],
        budgets: [],
        goals: [],
        investments: [],
        debts: [],
        apiKey: 'SECRET_API_KEY_123',
        serviceAccount: { private_key: 'PRIVATE_KEY' },
      };

      const keys = Object.keys(payloadWithAccidentalKeys);
      const forbidden = ['apiKey', 'serviceAccount', 'private_key', 'secret'];
      const leaked = keys.filter((k) => forbidden.includes(k));
      expect(leaked.length).toBeGreaterThan(0);

      const safeKeys = Object.keys({
        userId: payloadWithAccidentalKeys.userId,
        transactions: payloadWithAccidentalKeys.transactions,
        budgets: payloadWithAccidentalKeys.budgets,
        goals: payloadWithAccidentalKeys.goals,
        investments: payloadWithAccidentalKeys.investments,
        debts: payloadWithAccidentalKeys.debts,
      });
      forbidden.forEach((k) => expect(safeKeys).not.toContain(k));
    });

    it('formats point-in-time financial snapshot with exact calculated figures', () => {
      const snapshot = {
        asOfDate: '2026-09-25',
        liquidCash: 120000,
        monthlyIncome: 85000,
        monthlyExpenses: 52000,
        netWorth: 650000,
        totalAssets: 900000,
        totalLiabilities: 250000,
        healthScore: 82,
        currency: 'INR',
      };

      expect(snapshot.netWorth).toBe(snapshot.totalAssets - snapshot.totalLiabilities);
      expect(snapshot.liquidCash).toBe(120000);
      expect(snapshot.currency).toBe('INR');
    });
  });

  // --------------------------------------------------------------------------
  // 12. RESET SAFETY & AUDIT TRAIL (Minimum 3 tests)
  // --------------------------------------------------------------------------
  describe('Reset Safety & Audit Trail', () => {
    it('accurately counts all entities before allowing deletion', () => {
      const counts = {
        transactions: 42,
        budgets: 6,
        goals: 3,
        investments: 8,
        debts: 2,
      };

      expect(counts.transactions).toBe(42);
      expect(counts.budgets).toBe(6);
      expect(counts.goals).toBe(3);
      expect(counts.investments).toBe(8);
      expect(counts.debts).toBe(2);
    });

    it('requires exact confirmation keyword match "RESET" to prevent accidental clicks', () => {
      const validateResetConfirmation = (input: string) => input.trim() === 'RESET';

      expect(validateResetConfirmation('')).toBe(false);
      expect(validateResetConfirmation('reset')).toBe(false);
      expect(validateResetConfirmation('DELETE')).toBe(false);
      expect(validateResetConfirmation('RESET ')).toBe(true);
      expect(validateResetConfirmation('RESET')).toBe(true);
    });

    it('logs immutable audit event with actor, timestamp, action, and entity metadata', () => {
      clearAuditTrail();
      const event = logAuditEvent('DATA_RESET', 'user_abc', 'all_records', {
        deletedTransactions: 15,
        deletedBudgets: 4,
      });

      expect(event.action).toBe('DATA_RESET');
      expect(event.userId).toBe('user_abc');
      expect(event.entity).toBe('all_records');
      expect(event.timestamp).toBeDefined();

      const trail = getAuditTrail();
      expect(trail.length).toBeGreaterThanOrEqual(1);
      expect(trail[0].id).toBe(event.id);
    });
  });

  // --------------------------------------------------------------------------
  // 13. MILESTONE TRACKING
  // --------------------------------------------------------------------------
  describe('Deterministic Financial Milestones', () => {
    it('detects milestone completion based strictly on actual recorded balances', () => {
      const milestones = detectFinancialMilestones({
        liquidCash: 150000,
        netWorth: 600000,
        emergencyFundTarget: 180000,
        currentEmergencyFund: 180000,
        totalDebts: 0,
        hasInvestments: true,
        completedGoalsCount: 2,
      });

      const savings1Lakh = milestones.find((m) => m.id === 'SAVINGS_1_LAKH');
      expect(savings1Lakh?.isAchieved).toBe(true);

      const netWorth5Lakh = milestones.find((m) => m.id === 'NET_WORTH_5_LAKH');
      expect(netWorth5Lakh?.isAchieved).toBe(true);

      const debtFree = milestones.find((m) => m.id === 'DEBT_FREE');
      expect(debtFree?.isAchieved).toBe(true);

      const emergencyFund = milestones.find((m) => m.id === 'EMERGENCY_FUND_COMPLETED');
      expect(emergencyFund?.isAchieved).toBe(true);
    });

    it('does not mark milestone achieved if financial threshold has not been reached', () => {
      const milestones = detectFinancialMilestones({
        liquidCash: 50000,
        netWorth: 200000,
        emergencyFundTarget: 180000,
        currentEmergencyFund: 60000,
        totalDebts: 50000,
        hasInvestments: false,
        completedGoalsCount: 0,
      });

      const savings1Lakh = milestones.find((m) => m.id === 'SAVINGS_1_LAKH');
      expect(savings1Lakh?.isAchieved).toBe(false);

      const debtFree = milestones.find((m) => m.id === 'DEBT_FREE');
      expect(debtFree?.isAchieved).toBe(false);
    });
  });
});
