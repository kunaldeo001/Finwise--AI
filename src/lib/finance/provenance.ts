/**
 * AI Data Provenance & Epistemic Confidence System
 * Attaches verifiable data lineage (transactions count, period, category scope) and
 * replaces invented numerical percentages with standard epistemic tags (RECORDED, CALCULATED, ESTIMATE, AI-EXPLANATION).
 */

import { Transaction } from '@/lib/types/finance';

export type EpistemicTag = 'RECORDED' | 'CALCULATED' | 'ESTIMATE' | 'AI-EXPLANATION';

export interface DataProvenance {
  transactionsCount: number;
  periodAnalyzed: string;
  totalExpensesAnalyzed: number;
  totalIncomeAnalyzed: number;
  categoriesCovered: string[];
}

export interface AIActionSuggestion {
  label: string;
  route: string;
  description: string;
  badge?: string;
}

export function generateProvenance(
  transactions: Transaction[],
  relevantCategory?: string
): DataProvenance {
  const filtered = relevantCategory
    ? transactions.filter((t) => t.category.toLowerCase().includes(relevantCategory.toLowerCase()))
    : transactions;

  const dates = filtered.map((t) => new Date(t.date).getTime()).filter((t) => !isNaN(t));
  let periodAnalyzed = 'Current Financial Year';
  if (dates.length > 0) {
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const minMonth = minDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    const maxMonth = maxDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    periodAnalyzed = minMonth === maxMonth ? minMonth : `${minMonth} – ${maxMonth}`;
  }

  const totalExpenses = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const categories = Array.from(new Set(filtered.map((t) => t.category))).slice(0, 5);

  return {
    transactionsCount: filtered.length,
    periodAnalyzed,
    totalExpensesAnalyzed: totalExpenses,
    totalIncomeAnalyzed: totalIncome,
    categoriesCovered: categories,
  };
}

export function generateSuggestedActions(
  query: string,
  replyText: string
): AIActionSuggestion[] {
  const q = query.toLowerCase();
  const r = replyText.toLowerCase();
  const actions: AIActionSuggestion[] = [];

  if (q.includes('food') || q.includes('dining') || q.includes('budget') || r.includes('budget exceeded')) {
    actions.push({
      label: 'Review Food Budget',
      route: '/budgets',
      description: 'Check category spending pace & set budget thresholds',
      badge: 'Budget Action',
    });
  }

  if (q.includes('goal') || q.includes('emergency') || r.includes('emergency fund') || r.includes('behind')) {
    actions.push({
      label: 'Open Goal Roadmap',
      route: '/goals',
      description: 'Adjust monthly milestone contributions',
      badge: 'Goal Action',
    });
  }

  if (q.includes('save') || q.includes('reduce') || q.includes('what if') || q.includes('simulate')) {
    actions.push({
      label: 'Launch What-If Simulator',
      route: '/simulator',
      description: 'Model 5-year compounding impact of expense cuts',
      badge: 'Simulation',
    });
  }

  if (q.includes('subscription') || q.includes('recurring') || q.includes('netflix') || r.includes('subscriptions')) {
    actions.push({
      label: 'Manage Subscriptions',
      route: '/subscriptions',
      description: 'Audit active recurring mandates & cancel unused plans',
      badge: 'Surveillance',
    });
  }

  if (q.includes('loan') || q.includes('emi') || q.includes('debt') || r.includes('interest')) {
    actions.push({
      label: 'Optimize Loan Prepayment',
      route: '/debts',
      description: 'Simulate extra monthly payments to save interest',
      badge: 'Amortization',
    });
  }

  // Default fallback if no specific keywords matched
  if (actions.length === 0) {
    actions.push({
      label: 'View Detailed Ledger',
      route: '/transactions',
      description: 'Inspect full historical transaction itemization',
    });
  }

  return actions;
}
