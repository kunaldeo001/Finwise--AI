'use client';

import { useMemo, useState, useEffect } from 'react';
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
  ReceiptRecord,
} from '@/lib/types/finance';
import {
  calculateFinancialHealthScore,
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
import { useDemoMode } from '@/context/demo-mode-context';

export function useFinwiseData() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { isDemoMode } = useDemoMode();

  // A user is considered a real authenticated user ONLY if signed in non-anonymously
  const isAuthenticated = Boolean(user && !user.isAnonymous);
  const isDemo = Boolean(!isAuthenticated && isDemoMode);

  // Firestore queries for authenticated user
  const txQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthenticated || !user?.uid) return null;
    return collections.transactions(firestore, user.uid);
  }, [firestore, isAuthenticated, user?.uid]);

  const budgetsQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthenticated || !user?.uid) return null;
    return collections.budgets(firestore, user.uid);
  }, [firestore, isAuthenticated, user?.uid]);

  const goalsQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthenticated || !user?.uid) return null;
    return collections.goals(firestore, user.uid);
  }, [firestore, isAuthenticated, user?.uid]);

  const investmentsQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthenticated || !user?.uid) return null;
    return collections.investments(firestore, user.uid);
  }, [firestore, isAuthenticated, user?.uid]);

  const debtsQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthenticated || !user?.uid) return null;
    return collections.debts(firestore, user.uid);
  }, [firestore, isAuthenticated, user?.uid]);

  const alertsQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthenticated || !user?.uid) return null;
    return collections.alerts(firestore, user.uid);
  }, [firestore, isAuthenticated, user?.uid]);

  const receiptsQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthenticated || !user?.uid) return null;
    return collections.receipts(firestore, user.uid);
  }, [firestore, isAuthenticated, user?.uid]);

  // Real-time hooks
  const { data: dbTransactions, isLoading: txLoading } = useCollection<Transaction>(txQuery);
  const { data: dbBudgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsQuery);
  const { data: dbGoals, isLoading: goalsLoading } = useCollection<FinancialGoal>(goalsQuery);
  const { data: dbInvestments, isLoading: investmentsLoading } = useCollection<Investment>(investmentsQuery);
  const { data: dbDebts, isLoading: debtsLoading } = useCollection<DebtItem>(debtsQuery);
  const { data: dbAlerts, isLoading: alertsLoading } = useCollection<SmartAlert>(alertsQuery);
  const { data: dbReceipts, isLoading: receiptsLoading } = useCollection<ReceiptRecord>(receiptsQuery);

  // In-session demo transactions (if user adds test records in demo mode)
  const [sessionDemoTransactions, setSessionDemoTransactions] = useState<Transaction[]>([]);
  const [sessionDemoReceipts, setSessionDemoReceipts] = useState<ReceiptRecord[]>([]);

  useEffect(() => {
    if (isDemo && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('finwise_session_demo_txs');
        if (stored) setSessionDemoTransactions(JSON.parse(stored));
        const storedReceipts = sessionStorage.getItem('finwise_session_demo_receipts');
        if (storedReceipts) setSessionDemoReceipts(JSON.parse(storedReceipts));
      } catch {}
    }
  }, [isDemo]);

  // Canonical datasets:
  // In Authenticated Mode: STRICTLY user's Firestore records. Never polluted with demo data.
  // In Demo Mode: Canonical DEMO_* data + any in-session test transactions.
  const transactions: Transaction[] = useMemo(() => {
    if (isAuthenticated) {
      if (!dbTransactions) return [];
      return [...dbTransactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }
    if (isDemo) {
      const canonical = DEMO_TRANSACTIONS.map((tx, idx) => ({
        ...tx,
        id: `demo-tx-${idx}`,
        userId: 'demo-user',
        createdAt: new Date('2026-09-01T00:00:00Z').toISOString(),
      }));
      return [...sessionDemoTransactions, ...canonical].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }
    return [];
  }, [isAuthenticated, dbTransactions, isDemo, sessionDemoTransactions]);

  const budgets: Budget[] = useMemo(() => {
    if (isAuthenticated) return dbBudgets || [];
    if (isDemo) {
      return DEMO_BUDGETS.map((b, idx) => ({
        ...b,
        id: `demo-budget-${idx}`,
        userId: 'demo-user',
      }));
    }
    return [];
  }, [isAuthenticated, dbBudgets, isDemo]);

  const goals: FinancialGoal[] = useMemo(() => {
    if (isAuthenticated) return dbGoals || [];
    if (isDemo) {
      return DEMO_GOALS.map((g, idx) => ({
        ...g,
        id: `demo-goal-${idx}`,
        userId: 'demo-user',
        createdAt: new Date('2026-09-01T00:00:00Z').toISOString(),
      }));
    }
    return [];
  }, [isAuthenticated, dbGoals, isDemo]);

  const investments: Investment[] = useMemo(() => {
    if (isAuthenticated) return dbInvestments || [];
    if (isDemo) {
      return DEMO_INVESTMENTS.map((inv, idx) => ({
        ...inv,
        id: `demo-inv-${idx}`,
        userId: 'demo-user',
      }));
    }
    return [];
  }, [isAuthenticated, dbInvestments, isDemo]);

  const debts: DebtItem[] = useMemo(() => {
    if (isAuthenticated) return dbDebts || [];
    if (isDemo) {
      return DEMO_DEBTS.map((d, idx) => ({
        ...d,
        id: `demo-debt-${idx}`,
        userId: 'demo-user',
      }));
    }
    return [];
  }, [isAuthenticated, dbDebts, isDemo]);

  const alerts: SmartAlert[] = useMemo(() => {
    if (isAuthenticated) return dbAlerts || [];
    if (isDemo) {
      return DEMO_ALERTS.map((a, idx) => ({
        ...a,
        id: `demo-alert-${idx}`,
        userId: 'demo-user',
      }));
    }
    return [];
  }, [isAuthenticated, dbAlerts, isDemo]);

  const receipts: ReceiptRecord[] = useMemo(() => {
    if (isAuthenticated) return dbReceipts || [];
    if (isDemo) {
      const defaultDemoReceipts: ReceiptRecord[] = [
        {
          id: 'demo-rec-1',
          userId: 'demo-user',
          merchant: 'D-Mart Supermarket',
          transactionDate: '2026-09-24',
          totalAmount: 1845,
          subtotal: 1680,
          tax: 165,
          currency: 'INR',
          paymentMethod: 'UPI',
          category: 'Groceries',
          confidence: 96,
          status: 'PROCESSED',
          items: [
            { name: 'Organic Almonds 500g', quantity: 1, unitPrice: 420, total: 420 },
            { name: 'Aashirvaad Atta 5kg', quantity: 1, unitPrice: 260, total: 260 },
            { name: 'Dairy & Kitchen Staples', quantity: 1, unitPrice: 1000, total: 1000 },
          ],
          createdAt: '2026-09-24T14:20:00Z',
        },
        {
          id: 'demo-rec-2',
          userId: 'demo-user',
          merchant: 'Croma Electronics',
          transactionDate: '2026-09-18',
          totalAmount: 4299,
          subtotal: 3643,
          tax: 656,
          currency: 'INR',
          paymentMethod: 'Credit Card',
          category: 'Shopping',
          confidence: 92,
          status: 'PROCESSED',
          items: [
            { name: 'Logitech MX Master 3S', quantity: 1, unitPrice: 4299, total: 4299 },
          ],
          createdAt: '2026-09-18T18:10:00Z',
        },
      ];
      return [...sessionDemoReceipts, ...defaultDemoReceipts];
    }
    return [];
  }, [isAuthenticated, dbReceipts, isDemo, sessionDemoReceipts]);

  const currentMonthStr = useMemo(() => new Date().toISOString().substring(0, 7), []);

  // Aggregated totals & Net Worth (Single Source of Truth)
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

    // Calculate real accumulated balance across lifetime transactions
    const lifetimeIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const lifetimeExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // If demo mode, provide realistic liquid balance based on net savings benchmark
    const totalBalance = isDemo
      ? Math.max(85000, netSavings * 1.5)
      : Math.max(0, lifetimeIncome - lifetimeExpense);

    const netWorthResult = calculateNetWorth(
      investments,
      debts,
      totalBalance,
      netSavings
    );

    // Upcoming bills (recurring expenses + upcoming loan EMIs)
    const upcomingBillsList = transactions.filter(
      (t) =>
        (t.isRecurring || t.category === 'Subscriptions' || t.category === 'Debt & EMI') &&
        t.type === 'expense'
    );
    const upcomingBillsCount = upcomingBillsList.length;
    const upcomingBillsTotal = upcomingBillsList.reduce((s, t) => s + t.amount, 0);

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
  }, [transactions, investments, debts, currentMonthStr, isDemo]);

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
      currentMonthStr,
    });
  }, [transactions, budgets, totals, currentMonthStr]);

  const isLoading =
    isUserLoading ||
    (isAuthenticated &&
      (txLoading ||
        budgetsLoading ||
        goalsLoading ||
        investmentsLoading ||
        debtsLoading ||
        alertsLoading ||
        receiptsLoading));

  // Helper to add in-memory transaction during demo mode
  const addDemoTransaction = (tx: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `session-demo-tx-${Date.now()}`,
      userId: 'demo-user',
      createdAt: new Date().toISOString(),
    };
    const updated = [newTx, ...sessionDemoTransactions];
    setSessionDemoTransactions(updated);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('finwise_session_demo_txs', JSON.stringify(updated));
      } catch {}
    }
  };

  // Helper to add in-memory receipt during demo mode
  const addDemoReceipt = (receipt: Omit<ReceiptRecord, 'id' | 'userId' | 'createdAt'>) => {
    const newRec: ReceiptRecord = {
      ...receipt,
      id: `session-demo-rec-${Date.now()}`,
      userId: 'demo-user',
      createdAt: new Date().toISOString(),
    };
    const updated = [newRec, ...sessionDemoReceipts];
    setSessionDemoReceipts(updated);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('finwise_session_demo_receipts', JSON.stringify(updated));
      } catch {}
    }
  };

  return {
    user,
    isAuthenticated,
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
    receipts,
    totals,
    healthScore,
    budgetStatuses,
    subscriptionIntelligence,
    recurringTransactions,
    unusualSpending,
    spendingMoM,
    proactiveInsights,
    firestore,
    addDemoTransaction,
    addDemoReceipt,
  };
}
