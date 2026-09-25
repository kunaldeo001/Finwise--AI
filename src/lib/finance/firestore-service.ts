import {
  Firestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import {
  Transaction,
  Budget,
  FinancialGoal,
  Investment,
  DebtItem,
  SmartAlert,
  MonthlyReport,
} from '@/lib/types/finance';
import {
  DEMO_TRANSACTIONS,
  DEMO_BUDGETS,
  DEMO_GOALS,
  DEMO_INVESTMENTS,
  DEMO_DEBTS,
  DEMO_ALERTS,
} from './demo-data';

export const collections = {
  transactions: (firestore: Firestore, userId: string) =>
    collection(firestore, 'users', userId, 'transactions'),
  budgets: (firestore: Firestore, userId: string) =>
    collection(firestore, 'users', userId, 'budgets'),
  goals: (firestore: Firestore, userId: string) =>
    collection(firestore, 'users', userId, 'goals'),
  investments: (firestore: Firestore, userId: string) =>
    collection(firestore, 'users', userId, 'investments'),
  debts: (firestore: Firestore, userId: string) =>
    collection(firestore, 'users', userId, 'debts'),
  alerts: (firestore: Firestore, userId: string) =>
    collection(firestore, 'users', userId, 'alerts'),
  reports: (firestore: Firestore, userId: string) =>
    collection(firestore, 'users', userId, 'reports'),
  settings: (firestore: Firestore, userId: string) =>
    collection(firestore, 'users', userId, 'settings'),
};

/**
 * Load complete Fintech demo data for a user in batch
 */
export async function seedUserDemoData(firestore: Firestore, userId: string): Promise<void> {
  const batch = writeBatch(firestore);

  // 1. Transactions
  DEMO_TRANSACTIONS.forEach((tx) => {
    const ref = doc(collections.transactions(firestore, userId));
    batch.set(ref, {
      ...tx,
      userId,
      createdAt: new Date().toISOString(),
    });
  });

  // 2. Budgets
  DEMO_BUDGETS.forEach((b) => {
    const ref = doc(collections.budgets(firestore, userId));
    batch.set(ref, {
      ...b,
      userId,
    });
  });

  // 3. Goals
  DEMO_GOALS.forEach((g) => {
    const ref = doc(collections.goals(firestore, userId));
    batch.set(ref, {
      ...g,
      userId,
      createdAt: new Date().toISOString(),
    });
  });

  // 4. Investments
  DEMO_INVESTMENTS.forEach((inv) => {
    const ref = doc(collections.investments(firestore, userId));
    batch.set(ref, {
      ...inv,
      userId,
      lastUpdated: new Date().toISOString(),
    });
  });

  // 5. Debts
  DEMO_DEBTS.forEach((debt) => {
    const ref = doc(collections.debts(firestore, userId));
    batch.set(ref, {
      ...debt,
      userId,
    });
  });

  // 6. Alerts
  DEMO_ALERTS.forEach((alert) => {
    const ref = doc(collections.alerts(firestore, userId));
    batch.set(ref, {
      ...alert,
      userId,
    });
  });

  await batch.commit();
}

/**
 * Clear all demo/user data from Firestore for testing/reset
 */
export async function clearUserData(firestore: Firestore, userId: string): Promise<void> {
  const subcolls = ['transactions', 'budgets', 'goals', 'investments', 'debts', 'alerts', 'reports'];
  for (const sub of subcolls) {
    const colRef = collection(firestore, 'users', userId, sub);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const batch = writeBatch(firestore);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
}

/**
 * Transaction helpers
 */
export async function addTransaction(
  firestore: Firestore,
  userId: string,
  tx: Omit<Transaction, 'id' | 'userId' | 'createdAt'>
) {
  return addDoc(collections.transactions(firestore, userId), {
    ...tx,
    userId,
    createdAt: new Date().toISOString(),
  });
}

export async function deleteTransaction(firestore: Firestore, userId: string, txId: string) {
  return deleteDoc(doc(firestore, 'users', userId, 'transactions', txId));
}

/**
 * Budget helpers
 */
export async function addBudget(
  firestore: Firestore,
  userId: string,
  budget: Omit<Budget, 'id' | 'userId'>
) {
  return addDoc(collections.budgets(firestore, userId), {
    ...budget,
    userId,
  });
}

export async function updateBudget(
  firestore: Firestore,
  userId: string,
  budgetId: string,
  updates: Partial<Budget>
) {
  return updateDoc(doc(firestore, 'users', userId, 'budgets', budgetId), updates);
}

export async function deleteBudget(firestore: Firestore, userId: string, budgetId: string) {
  return deleteDoc(doc(firestore, 'users', userId, 'budgets', budgetId));
}

/**
 * Goal helpers
 */
export async function addGoal(
  firestore: Firestore,
  userId: string,
  goal: Omit<FinancialGoal, 'id' | 'userId' | 'createdAt'>
) {
  return addDoc(collections.goals(firestore, userId), {
    ...goal,
    userId,
    createdAt: new Date().toISOString(),
  });
}

export async function updateGoal(
  firestore: Firestore,
  userId: string,
  goalId: string,
  updates: Partial<FinancialGoal>
) {
  return updateDoc(doc(firestore, 'users', userId, 'goals', goalId), updates);
}

export async function deleteGoal(firestore: Firestore, userId: string, goalId: string) {
  return deleteDoc(doc(firestore, 'users', userId, 'goals', goalId));
}

/**
 * Investment helpers
 */
export async function addInvestment(
  firestore: Firestore,
  userId: string,
  inv: Omit<Investment, 'id' | 'userId'>
) {
  const investedAmount = inv.quantity * inv.buyPrice;
  const currentValue = inv.quantity * inv.currentPrice;
  const returnAmount = currentValue - investedAmount;
  const returnPercentage = investedAmount > 0 ? (returnAmount / investedAmount) * 100 : 0;

  return addDoc(collections.investments(firestore, userId), {
    ...inv,
    investedAmount,
    currentValue,
    returnAmount,
    returnPercentage: parseFloat(returnPercentage.toFixed(2)),
    userId,
    lastUpdated: new Date().toISOString(),
  });
}

export async function updateInvestment(
  firestore: Firestore,
  userId: string,
  invId: string,
  updates: Partial<Investment>
) {
  return updateDoc(doc(firestore, 'users', userId, 'investments', invId), {
    ...updates,
    lastUpdated: new Date().toISOString(),
  });
}

export async function deleteInvestment(firestore: Firestore, userId: string, invId: string) {
  return deleteDoc(doc(firestore, 'users', userId, 'investments', invId));
}

/**
 * Debt helpers
 */
export async function addDebt(
  firestore: Firestore,
  userId: string,
  debt: Omit<DebtItem, 'id' | 'userId'>
) {
  return addDoc(collections.debts(firestore, userId), {
    ...debt,
    userId,
  });
}

export async function updateDebt(
  firestore: Firestore,
  userId: string,
  debtId: string,
  updates: Partial<DebtItem>
) {
  return updateDoc(doc(firestore, 'users', userId, 'debts', debtId), updates);
}

export async function deleteDebt(firestore: Firestore, userId: string, debtId: string) {
  return deleteDoc(doc(firestore, 'users', userId, 'debts', debtId));
}

/**
 * Alert helpers
 */
export async function markAlertAsRead(firestore: Firestore, userId: string, alertId: string) {
  return updateDoc(doc(firestore, 'users', userId, 'alerts', alertId), { read: true });
}

export async function deleteAlert(firestore: Firestore, userId: string, alertId: string) {
  return deleteDoc(doc(firestore, 'users', userId, 'alerts', alertId));
}

/**
 * Report helpers
 */
export async function saveMonthlyReport(
  firestore: Firestore,
  userId: string,
  report: Omit<MonthlyReport, 'id' | 'userId'>
) {
  return addDoc(collections.reports(firestore, userId), {
    ...report,
    userId,
  });
}
