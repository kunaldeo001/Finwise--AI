'use client';

import { useMemo } from 'react';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collections } from '@/lib/finance/firestore-service';
import {
  Transaction,
  Budget,
  FinancialGoal,
  Investment,
  DebtItem,
  SmartAlert,
  FinancialHealthScore,
  CashFlowForecast,
  SubscriptionItem,
  ProactiveInsight,
} from '@/lib/types/finance';
import {
  calculateFinancialHealthScore,
  generateCashFlowForecast,
  calculateBudgetStatus,
  calculateGoalMetrics,
  calculateNetWorth,
  calculateWeightedInterestRate,
} from '@/lib/finance/calculations';
import {
  detectRecurringTransactions,
  detectUnusualSpending,
  generateSpendingIntelligence,
  detectSubscriptions,
  generateProactiveInsights,
} from '@/lib/finance/intelligence';
import {
  DEMO_TRANSACTIONS,
  DEMO_BUDGETS,
  DEMO_GOALS,
  DEMO_INVESTMENTS,
  DEMO_DEBTS,
  DEMO_ALERTS,
} from '@/lib/finance/demo-data';

export function useFinwiseData() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Firestore queries wrapped in useMemoFirebase
  const txQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collections.transactions(firestore, user.uid);
  }, [firestore, user?.uid]);

  const budgetsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collections.budgets(firestore, user.uid);
  }, [firestore, user?.uid]);

  const goalsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collections.goals(firestore, user.uid);
  }, [firestore, user?.uid]);

  const investmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collections.investments(firestore, user.uid);
  }, [firestore, user?.uid]);

  const debtsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collections.debts(firestore, user.uid);
  }, [firestore, user?.uid]);

  const alertsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collections.alerts(firestore, user.uid);
  }, [firestore, user?.uid]);

  // Real-time hooks
  const { data: dbTransactions, isLoading: txLoading } = useCollection<Transaction>(txQuery);
  const { data: dbBudgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsQuery);
  const { data: dbGoals, isLoading: goalsLoading } = useCollection<FinancialGoal>(goalsQuery);
  const { data: dbInvestments, isLoading: investmentsLoading } = useCollection<Investment>(investmentsQuery);
  const { data: dbDebts, isLoading: debtsLoading } = useCollection<DebtItem>(debtsQuery);
  const { data: dbAlerts, isLoading: alertsLoading } = useCollection<SmartAlert>(alertsQuery);

  const hasUserFirestoreData =
    (dbTransactions && dbTransactions.length > 0) ||
    (dbBudgets && dbBudgets.length > 0) ||
    (dbGoals && dbGoals.length > 0) ||
    (dbInvestments && dbInvestments.length > 0);

  const isDemo = !user || !hasUserFirestoreData;

  const transactions: Transaction[] = useMemo(() => {
    if (dbTransactions && dbTransactions.length > 0) {
      return [...dbTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return DEMO_TRANSACTIONS.map((tx, idx) => ({
      ...tx,
      id: `demo-tx-${idx}`,
      userId: user?.uid || 'demo-user',
      createdAt: new Date().toISOString(),
    }));
  }, [dbTransactions, user?.uid]);

  const budgets: Budget[] = useMemo(() => {
    if (dbBudgets && dbBudgets.length > 0) return dbBudgets;
    return DEMO_BUDGETS.map((b, idx) => ({
      ...b,
      id: `demo-budget-${idx}`,
      userId: user?.uid || 'demo-user',
    }));
  }, [dbBudgets, user?.uid]);

  const goals: FinancialGoal[] = useMemo(() => {
    if (dbGoals && dbGoals.length > 0) return dbGoals;
    return DEMO_GOALS.map((g, idx) => ({
      ...g,
      id: `demo-goal-${idx}`,
      userId: user?.uid || 'demo-user',
      createdAt: new Date().toISOString(),
    }));
  }, [dbGoals, user?.uid]);

  const investments: Investment[] = useMemo(() => {
    if (dbInvestments && dbInvestments.length > 0) return dbInvestments;
    return DEMO_INVESTMENTS.map((inv, idx) => ({
      ...inv,
      id: `demo-inv-${idx}`,
      userId: user?.uid || 'demo-user',
    }));
  }, [dbInvestments, user?.uid]);

  const debts: DebtItem[] = useMemo(() => {
    if (dbDebts && dbDebts.length > 0) return dbDebts;
    return DEMO_DEBTS.map((d, idx) => ({
      ...d,
      id: `demo-debt-${idx}`,
      userId: user?.uid || 'demo-user',
    }));
  }, [dbDebts, user?.uid]);

  const alerts: SmartAlert[] = useMemo(() => {
    if (dbAlerts && dbAlerts.length > 0) return dbAlerts;
    return DEMO_ALERTS.map((a, idx) => ({
      ...a,
      id: `demo-alert-${idx}`,
      userId: user?.uid || 'demo-user',
    }));
  }, [dbAlerts, user?.uid]);

  const currentMonthStr = useMemo(() => new Date().toISOString().substring(0, 7), []);

  // Aggregated totals & Net Worth
  const totals = useMemo(() => {
    const currentMonthExpenses = transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthIncome = transactions
      .filter((t) => t.type === 'income' && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + t.amount, 0);

    const netSavings = Math.max(0, currentMonthIncome - currentMonthExpenses);
    const savingsRate = currentMonthIncome > 0 ? (netSavings / currentMonthIncome) * 100 : 0;

    const totalInvested = investments.reduce((sum, inv) => sum + (inv.investedAmount || 0), 0);
    const currentPortfolioValue = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
    const portfolioGain = currentPortfolioValue - totalInvested;
    const portfolioGainPct = totalInvested > 0 ? (portfolioGain / totalInvested) * 100 : 0;

    const totalDebtRemaining = debts.reduce((sum, d) => sum + (d.remainingBalance || 0), 0);
    const totalMonthlyEmi = debts.reduce((sum, d) => sum + (d.emi || 0), 0);
    const weightedInterestRate = calculateWeightedInterestRate(debts);

    // Liquid savings estimate
    const totalBalance = Math.max(48500, netSavings * 2.2);

    const netWorthResult = calculateNetWorth(
      investments,
      debts,
      totalBalance,
      netSavings
    );

    // Upcoming bills (recurring expenses + upcoming loan EMIs in next 10 days)
    const upcomingBillsList = transactions.filter(
      (t) => (t.isRecurring || t.category === 'Subscriptions' || t.category === 'Debt & EMI') && t.type === 'expense'
    );
    const upcomingBillsCount = upcomingBillsList.length || 3;
    const upcomingBillsTotal = upcomingBillsList.reduce((s, t) => s + t.amount, 0) || totalMonthlyEmi;

    return {
      totalBalance,
      currentMonthIncome,
      currentMonthExpenses,
      netSavings,
      savingsRate,
      totalInvested,
      currentPortfolioValue,
      portfolioGain,
      portfolioGainPct,
      totalDebtRemaining,
      totalMonthlyEmi,
      weightedInterestRate,
      upcomingBillsCount,
      upcomingBillsTotal,
      totalAssets: netWorthResult.totalAssets,
      totalLiabilities: netWorthResult.totalLiabilities,
      netWorth: netWorthResult.netWorth,
      previousNetWorth: netWorthResult.previousNetWorth,
      netWorthChange: netWorthResult.netWorthChange,
      netWorthChangePct: netWorthResult.netWorthChangePct,
      assetDistribution: netWorthResult.assetDistribution,
      liabilityDistribution: netWorthResult.liabilityDistribution,
    };
  }, [transactions, investments, debts, currentMonthStr]);

  // Derived calculations
  const healthScore = useMemo(() => {
    return calculateFinancialHealthScore({
      monthlyIncome: totals.currentMonthIncome,
      monthlyExpense: totals.currentMonthExpenses,
      monthlyDebtEmi: totals.totalMonthlyEmi,
      liquidSavings: totals.totalBalance,
      budgets,
      transactions,
      goals,
    });
  }, [totals, budgets, transactions, goals]);

  const budgetStatuses = useMemo(() => {
    return calculateBudgetStatus(budgets, transactions, currentMonthStr);
  }, [budgets, transactions, currentMonthStr]);

  const goalOptimizedList = useMemo(() => {
    return goals.map((g) => ({
      goal: g,
      metrics: calculateGoalMetrics(g),
    }));
  }, [goals]);

  const subscriptionIntelligence = useMemo(() => {
    return detectSubscriptions(transactions);
  }, [transactions]);

  const recurringTransactions = useMemo(() => {
    return detectRecurringTransactions(transactions);
  }, [transactions]);

  const unusualSpending = useMemo(() => {
    return detectUnusualSpending(transactions);
  }, [transactions]);

  const spendingMoM = useMemo(() => {
    return generateSpendingIntelligence(transactions, currentMonthStr);
  }, [transactions, currentMonthStr]);

  const proactiveInsights = useMemo(() => {
    return generateProactiveInsights({
      transactions,
      budgets,
      monthlyIncome: totals.currentMonthIncome,
      monthlyExpense: totals.currentMonthExpenses,
      liquidSavings: totals.totalBalance,
    });
  }, [transactions, budgets, totals]);

  const isLoading = isUserLoading || txLoading || budgetsLoading || goalsLoading || investmentsLoading || debtsLoading;

  return {
    user,
    isUserLoading,
    isLoading,
    isDemo,
    transactions,
    budgets,
    goals,
    goalOptimizedList,
    investments,
    debts,
    alerts,
    totals,
    healthScore,
    budgetStatuses,
    subscriptionIntelligence,
    recurringTransactions,
    unusualSpending,
    spendingMoM,
    proactiveInsights,
    firestore,
  };
}
