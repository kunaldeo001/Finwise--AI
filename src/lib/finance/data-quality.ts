/**
 * Deterministic Financial Data-Quality Engine
 * Audits ledger consistency, broken debt/investment records, invalid goals, and suspicious outliers without mutating data.
 */

import { Transaction, Budget, FinancialGoal, Investment, DebtItem } from '@/lib/types/finance';

export type DataQualitySeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface DataQualityIssue {
  id: string;
  checkId: string;
  severity: DataQualitySeverity;
  issue: string;
  affectedRecords: number;
  affectedCount: number;
  explanation: string;
  suggestedFix: string;
  recordIds: string[];
}

export interface DataQualityReport {
  analyzedAt: string;
  totalTransactionsAnalyzed: number;
  totalBudgetsAnalyzed: number;
  totalGoalsAnalyzed: number;
  totalInvestmentsAnalyzed: number;
  totalDebtsAnalyzed: number;
  qualityScore: number; // 0-100 composite score
  issues: DataQualityIssue[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  summary: {
    critical: number;
    warning: number;
    info: number;
  };
  isClean: boolean;
}

export function auditFinancialDataQuality(params?: {
  transactions?: Transaction[];
  budgets?: Budget[];
  goals?: FinancialGoal[];
  investments?: Investment[];
  debts?: DebtItem[];
  currentDate?: Date;
}): DataQualityReport {
  const {
    transactions = [],
    budgets = [],
    goals = [],
    investments = [],
    debts = [],
    currentDate = new Date(),
  } = params || {};

  const issues: DataQualityIssue[] = [];
  const todayStr = currentDate.toISOString().substring(0, 10);
  const tomorrowTime = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000).getTime();

  // -------------------------------------------------------------
  // 1. Missing or unparseable transaction dates (CRITICAL)
  // -------------------------------------------------------------
  const missingDateTxs = transactions.filter((t) => !t.date || isNaN(new Date(t.date).getTime()));
  if (missingDateTxs.length > 0) {
    issues.push({
      id: 'missing-dates',
      checkId: 'MISSING_DATE',
      severity: 'CRITICAL',
      issue: 'Missing or Invalid Transaction Dates',
      affectedRecords: missingDateTxs.length,
      affectedCount: missingDateTxs.length,
      explanation: `${missingDateTxs.length} transaction(s) have unparseable or blank date fields, preventing accurate cash-flow timeline plotting.`,
      suggestedFix: 'Edit transaction records and provide a valid YYYY-MM-DD date.',
      recordIds: missingDateTxs.map((t) => t.id),
    });
  }

  // -------------------------------------------------------------
  // 2. Invalid transaction amounts (<= 0 or NaN) (CRITICAL)
  // -------------------------------------------------------------
  const invalidAmountTxs = transactions.filter((t) => t.amount === undefined || isNaN(t.amount) || t.amount <= 0);
  if (invalidAmountTxs.length > 0) {
    issues.push({
      id: 'invalid-amounts',
      checkId: 'INVALID_AMOUNT',
      severity: 'CRITICAL',
      issue: 'Zero or Negative Transaction Amounts',
      affectedRecords: invalidAmountTxs.length,
      affectedCount: invalidAmountTxs.length,
      explanation: `${invalidAmountTxs.length} transaction(s) have an amount of ₹0 or a negative value. Amounts must be positive numbers.`,
      suggestedFix: 'Correct transaction amount to a positive number and designate income/expense via transaction type.',
      recordIds: invalidAmountTxs.map((t) => t.id),
    });
  }

  // -------------------------------------------------------------
  // 3. Duplicate transactions (WARNING)
  // -------------------------------------------------------------
  const duplicateIds = new Set<string>();
  for (let i = 0; i < transactions.length; i++) {
    for (let j = i + 1; j < transactions.length; j++) {
      const a = transactions[i];
      const b = transactions[j];
      const sameDate = a.date === b.date;
      const sameAmount = Math.abs(a.amount - b.amount) < 0.01;
      const normA = (a.merchant || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const normB = (b.merchant || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const sameMerchant = normA.length >= 2 && normA === normB;
      const sameType = a.type === b.type;

      if (sameDate && sameAmount && sameMerchant && sameType) {
        duplicateIds.add(b.id);
      }
    }
  }
  if (duplicateIds.size > 0) {
    issues.push({
      id: 'duplicate-transactions',
      checkId: 'DUPLICATE_TRANSACTION',
      severity: 'WARNING',
      issue: 'Duplicate Transactions Detected',
      affectedRecords: duplicateIds.size,
      affectedCount: duplicateIds.size,
      explanation: `${duplicateIds.size} potential duplicate transaction(s) share identical date, amount, and merchant name.`,
      suggestedFix: 'Review duplicate entries and remove unintended import copies in the Transactions ledger.',
      recordIds: Array.from(duplicateIds),
    });
  }

  // -------------------------------------------------------------
  // 4. Unknown or blank categories (WARNING)
  // -------------------------------------------------------------
  const unknownCategoryKeywords = ['uncategorized', 'unknown', 'other', 'none', ''];
  const uncategorizedTxs = transactions.filter((t) => {
    const cat = (t.category || '').toLowerCase().trim();
    return unknownCategoryKeywords.includes(cat);
  });
  if (uncategorizedTxs.length > 0) {
    issues.push({
      id: 'uncategorized-transactions',
      checkId: 'UNKNOWN_CATEGORY',
      severity: 'WARNING',
      issue: 'Uncategorized or Unknown Category Transactions',
      affectedRecords: uncategorizedTxs.length,
      affectedCount: uncategorizedTxs.length,
      explanation: `${uncategorizedTxs.length} transaction(s) are filed under uncategorized, unknown, or missing category labeling.`,
      suggestedFix: 'Assign transactions to Food, Utilities, Transit, or Shopping to refine budget analytics.',
      recordIds: uncategorizedTxs.map((t) => t.id),
    });
  }

  // -------------------------------------------------------------
  // 5. Missing or generic merchants (WARNING)
  // -------------------------------------------------------------
  const genericKeywords = ['upi', 'pos', 'payment', 'transfer', 'debit', 'txn', 'card', 'unknown', 'merchant', 'n/a', 'na'];
  const missingMerchantTxs = transactions.filter((t) => {
    const m = (t.merchant || '').toLowerCase().trim();
    return !m || m.length < 3 || genericKeywords.includes(m);
  });
  if (missingMerchantTxs.length > 0) {
    issues.push({
      id: 'generic-merchants',
      checkId: 'MISSING_MERCHANT',
      severity: 'WARNING',
      issue: 'Generic or Missing Merchant Names',
      affectedRecords: missingMerchantTxs.length,
      affectedCount: missingMerchantTxs.length,
      explanation: `${missingMerchantTxs.length} transaction(s) have placeholder or generic merchant labels like "merchant" or "N/A".`,
      suggestedFix: 'Rename merchants to distinct payees (e.g. Swiggy, Amazon, HDFC) to improve auto-categorization.',
      recordIds: missingMerchantTxs.map((t) => t.id),
    });
  }

  // -------------------------------------------------------------
  // 6. Future-dated transactions (WARNING)
  // -------------------------------------------------------------
  const futureDatedTxs = transactions.filter((t) => {
    if (!t.date) return false;
    const txTime = new Date(t.date).getTime();
    return txTime > tomorrowTime;
  });
  if (futureDatedTxs.length > 0) {
    issues.push({
      id: 'future-dated-transactions',
      checkId: 'FUTURE_DATE',
      severity: 'WARNING',
      issue: 'Future-Dated Transactions',
      affectedRecords: futureDatedTxs.length,
      affectedCount: futureDatedTxs.length,
      explanation: `${futureDatedTxs.length} transaction(s) are timestamped after tomorrow's date (${todayStr}).`,
      suggestedFix: 'Verify statement timestamps or classify post-dated checks as scheduled bills rather than cleared ledger items.',
      recordIds: futureDatedTxs.map((t) => t.id),
    });
  }

  // -------------------------------------------------------------
  // 7. Suspiciously large outlier transactions (> ₹5,00,000) (INFO)
  // -------------------------------------------------------------
  const outlierTxs = transactions.filter((t) => {
    return t.amount >= 500000;
  });
  if (outlierTxs.length > 0) {
    issues.push({
      id: 'suspicious-large-transactions',
      checkId: 'LARGE_OUTLIER',
      severity: 'INFO',
      issue: 'Suspiciously Large Outlier Transactions',
      affectedRecords: outlierTxs.length,
      affectedCount: outlierTxs.length,
      explanation: `${outlierTxs.length} transaction(s) exceed ₹5,00,000, which may skew monthly metrics.`,
      suggestedFix: 'Confirm whether this was a planned capital expenditure or an erroneous extra zero in statement entry.',
      recordIds: outlierTxs.map((t) => t.id),
    });
  }

  // -------------------------------------------------------------
  // 8. Conflicting transaction types (WARNING)
  // -------------------------------------------------------------
  const conflictingTxs = transactions.filter((t) => {
    if (t.category === 'Salary' && t.type === 'expense') return true;
    if (t.category === 'Food' && t.type === 'income') return true;
    if (t.category === 'Food & Dining' && t.type === 'income') return true;
    return false;
  });
  if (conflictingTxs.length > 0) {
    issues.push({
      id: 'conflicting-types',
      checkId: 'CONFLICTING_TYPE',
      severity: 'WARNING',
      issue: 'Conflicting Category & Transaction Type',
      affectedRecords: conflictingTxs.length,
      affectedCount: conflictingTxs.length,
      explanation: `${conflictingTxs.length} transaction(s) have contradictory definitions (e.g. Salary marked as Outflow or Food marked as Income).`,
      suggestedFix: 'Flip the transaction type toggle to match standard financial conventions.',
      recordIds: conflictingTxs.map((t) => t.id),
    });
  }

  // -------------------------------------------------------------
  // 9. Invalid recurring-payment patterns (INFO)
  // -------------------------------------------------------------
  const invalidRecurringTxs = transactions.filter((t) => {
    return t.isRecurring && (t.amount <= 0 || (!t.recurringFrequency && !(t as any).frequency));
  });
  if (invalidRecurringTxs.length > 0) {
    issues.push({
      id: 'invalid-recurring-frequency',
      checkId: 'INVALID_RECURRING',
      severity: 'INFO',
      issue: 'Recurring Transactions with Zero Amount or Undefined Cadence',
      affectedRecords: invalidRecurringTxs.length,
      affectedCount: invalidRecurringTxs.length,
      explanation: `${invalidRecurringTxs.length} recurring subscription(s) have zero amount or missing frequency.`,
      suggestedFix: 'Set standard recurring subscription cost and monthly cadence.',
      recordIds: invalidRecurringTxs.map((t) => t.id),
    });
  }

  // -------------------------------------------------------------
  // 10. Broken investment records (CRITICAL)
  // -------------------------------------------------------------
  const brokenInvestments = investments.filter((inv) => {
    const qty = inv.quantity ?? (inv as any).shares;
    return (qty !== undefined && qty <= 0) || inv.buyPrice <= 0 || (inv.currentPrice !== undefined && inv.currentPrice < 0);
  });
  if (brokenInvestments.length > 0) {
    issues.push({
      id: 'broken-investments',
      checkId: 'BROKEN_INVESTMENT',
      severity: 'CRITICAL',
      issue: 'Broken Investment Records',
      affectedRecords: brokenInvestments.length,
      affectedCount: brokenInvestments.length,
      explanation: `${brokenInvestments.length} investment holding(s) contain zero/negative shares or acquisition price.`,
      suggestedFix: 'Update asset units and average acquisition cost in the Investments portfolio.',
      recordIds: brokenInvestments.map((i) => i.id),
    });
  }

  // -------------------------------------------------------------
  // 11. Invalid debt records (CRITICAL)
  // -------------------------------------------------------------
  const invalidDebts = debts.filter((d) => {
    const principal = (d as any).principal ?? (d as any).principalAmount;
    const balance = d.remainingBalance ?? (d as any).currentBalance;
    const rate = d.interestRate;
    return (principal !== undefined && principal < 0) ||
      (balance !== undefined && balance < 0) ||
      rate < 0 ||
      rate > 100;
  });
  if (invalidDebts.length > 0) {
    issues.push({
      id: 'invalid-debts',
      checkId: 'INVALID_DEBT',
      severity: 'CRITICAL',
      issue: 'Invalid Loan or Debt Specifications',
      affectedRecords: invalidDebts.length,
      affectedCount: invalidDebts.length,
      explanation: `${invalidDebts.length} debt entry/entries feature negative principal, negative balances, or an interest rate exceeding 100%.`,
      suggestedFix: 'Recalculate loan principal and installment schedule in Debt & EMI Planner.',
      recordIds: invalidDebts.map((d) => d.id),
    });
  }

  // -------------------------------------------------------------
  // 12. Impossible goal values (CRITICAL)
  // -------------------------------------------------------------
  const impossibleGoals = goals.filter((g) => g.targetAmount <= 0);
  if (impossibleGoals.length > 0) {
    issues.push({
      id: 'impossible-goals',
      checkId: 'IMPOSSIBLE_GOAL',
      severity: 'CRITICAL',
      issue: 'Impossible Goal Target Values',
      affectedRecords: impossibleGoals.length,
      affectedCount: impossibleGoals.length,
      explanation: `${impossibleGoals.length} savings goal(s) have target values <= ₹0. Goals must possess a positive monetary target.`,
      suggestedFix: 'Set a positive target capital amount in Financial Goals.',
      recordIds: impossibleGoals.map((g) => g.id),
    });
  }

  // Calculate composite quality score (100 base)
  let penalty = 0;
  let criticalCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const issue of issues) {
    if (issue.severity === 'CRITICAL') {
      penalty += Math.min(30, issue.affectedRecords * 10);
      criticalCount++;
    } else if (issue.severity === 'WARNING') {
      penalty += Math.min(15, issue.affectedRecords * 5);
      warningCount++;
    } else {
      penalty += Math.min(5, issue.affectedRecords * 1);
      infoCount++;
    }
  }

  const qualityScore = Math.max(0, 100 - penalty);

  return {
    analyzedAt: new Date().toISOString(),
    totalTransactionsAnalyzed: transactions.length,
    totalBudgetsAnalyzed: budgets.length,
    totalGoalsAnalyzed: goals.length,
    totalInvestmentsAnalyzed: investments.length,
    totalDebtsAnalyzed: debts.length,
    qualityScore,
    issues,
    criticalCount,
    warningCount,
    infoCount,
    summary: {
      critical: criticalCount,
      warning: warningCount,
      info: infoCount,
    },
    isClean: issues.length === 0,
  };
}
