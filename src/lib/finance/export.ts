/**
 * Data Export Utilities
 * Provides clean CSV and JSON reporting downloads for transactions, budgets, goals, and monthly reviews.
 */

import { Transaction, Budget, FinancialGoal, Investment } from '@/lib/types/finance';

function downloadFile(content: string, filename: string, mimeType: string) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTransactionsCSV(transactions: Transaction[], filename = 'finwise_transactions.csv') {
  const headers = ['Date', 'Merchant', 'Category', 'Type', 'Amount (INR)', 'Payment Method', 'Is Recurring', 'Description'];
  const rows = transactions.map((t) => [
    `"${t.date}"`,
    `"${(t.merchant || '').replace(/"/g, '""')}"`,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    `"${t.type}"`,
    t.amount,
    `"${(t.paymentMethod || 'Other').replace(/"/g, '""')}"`,
    t.isRecurring ? 'Yes' : 'No',
    `"${(t.description || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportBudgetsCSV(
  budgetStatuses: Array<{
    budget: Budget;
    spent: number;
    limit: number;
    remaining: number;
    percentage: number;
    projectedMonthEndSpend: number;
    paceInsight: string;
  }>,
  filename = 'finwise_budget_report.csv'
) {
  const headers = ['Category', 'Monthly Limit (INR)', 'Actual Spent (INR)', 'Remaining (INR)', 'Usage %', 'Projected Month-End (INR)', 'Pacing Insight'];
  const rows = budgetStatuses.map((b) => [
    `"${b.budget.category}"`,
    b.limit,
    b.spent,
    b.remaining,
    `${b.percentage.toFixed(1)}%`,
    b.projectedMonthEndSpend,
    `"${b.paceInsight.replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportGoalsCSV(
  goalItems: Array<{
    goal: FinancialGoal;
    metrics: {
      progressPercentage: number;
      status: string;
      requiredMonthlySavings: number;
      shortfallPerMonth: number;
    };
  }>,
  filename = 'finwise_goals_report.csv'
) {
  const headers = ['Goal Name', 'Category', 'Target Amount (INR)', 'Current Saved (INR)', 'Progress %', 'Target Date', 'Status', 'Required Monthly (INR)', 'Monthly Shortfall (INR)'];
  const rows = goalItems.map(({ goal, metrics }) => [
    `"${goal.name.replace(/"/g, '""')}"`,
    `"${goal.category}"`,
    goal.targetAmount,
    goal.currentAmount,
    `${metrics.progressPercentage.toFixed(1)}%`,
    `"${goal.targetDate}"`,
    `"${metrics.status}"`,
    metrics.requiredMonthlySavings,
    metrics.shortfallPerMonth,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportInvestmentsCSV(
  investments: Investment[],
  filename = 'finwise_investments_portfolio.csv'
) {
  const headers = ['Asset Name', 'Symbol', 'Asset Type', 'Quantity', 'Buy Price (INR)', 'Invested Amount (INR)', 'Current Value (INR)', 'P&L (INR)', 'P&L %'];
  const rows = investments.map((inv) => {
    const gain = inv.currentValue - inv.investedAmount;
    const gainPct = inv.investedAmount > 0 ? (gain / inv.investedAmount) * 100 : 0;
    return [
      `"${inv.name.replace(/"/g, '""')}"`,
      `"${inv.symbol}"`,
      `"${inv.assetType}"`,
      inv.quantity,
      inv.buyPrice,
      inv.investedAmount,
      inv.currentValue,
      gain,
      `${gainPct.toFixed(2)}%`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportMonthlyReportJSON(reportData: Record<string, unknown>, filename = 'finwise_monthly_review.json') {
  const jsonContent = JSON.stringify(reportData, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
}

/**
 * Export My Data (Full Structured JSON Export)
 * Securely packages user-owned financial records into a structured JSON file.
 * Strictly excludes API keys, authentication secrets, and private credentials.
 */
export function exportFullUserDataJSON(
  payload: {
    userId: string;
    transactions: Transaction[];
    budgets: Budget[];
    goals: FinancialGoal[];
    investments: Investment[];
    debts: unknown[];
    subscriptions?: unknown[];
    reports?: unknown[];
    settings?: Record<string, unknown>;
  },
  filename = `finwise_user_data_export_${new Date().toISOString().substring(0, 10)}.json`
) {
  // Strip any accidental sensitive internal keys
  const sanitized = {
    exportMetadata: {
      generator: 'FinWise AI Data Portability Engine',
      exportedAt: new Date().toISOString(),
      formatVersion: '1.0',
      userId: payload.userId,
      recordCounts: {
        transactions: payload.transactions.length,
        budgets: payload.budgets.length,
        goals: payload.goals.length,
        investments: payload.investments.length,
        debts: payload.debts.length,
      },
    },
    transactions: payload.transactions,
    budgets: payload.budgets,
    goals: payload.goals,
    investments: payload.investments,
    debts: payload.debts,
    subscriptions: payload.subscriptions || [],
    reports: payload.reports || [],
    settings: {
      currency: 'INR',
      alertPreferences: payload.settings?.alertPreferences || {},
    },
  };

  const jsonContent = JSON.stringify(sanitized, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
}

/**
 * Financial Snapshot Export
 * Generates an auditable point-in-time financial statement from actual stored ledger data.
 */
export function exportFinancialSnapshotJSON(
  snapshot: {
    asOfDate: string;
    totals: {
      liquidCash: number;
      monthlyIncome: number;
      monthlyExpenses: number;
      netSavings: number;
      savingsRate: number;
      netWorth: number;
      totalInvested: number;
      portfolioValue: number;
      totalDebtRemaining: number;
    };
    healthScore: number;
    cashRunwayMonths: number;
    emergencyFundCoverageMonths: number;
    activeBudgetsCount: number;
    activeGoalsCount: number;
  },
  filename = `finwise_financial_snapshot_${snapshot.asOfDate}.json`
) {
  const jsonContent = JSON.stringify(
    {
      documentType: 'FINWISE_POINT_IN_TIME_FINANCIAL_SNAPSHOT',
      generatedAt: new Date().toISOString(),
      disclaimer: 'Generated from actual stored ledger data. For informational and wealth planning use only.',
      ...snapshot,
    },
    null,
    2
  );
  downloadFile(jsonContent, filename, 'application/json');
}
