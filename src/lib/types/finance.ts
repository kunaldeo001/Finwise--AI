export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'Salary'
  | 'Freelance'
  | 'Investments'
  | 'Food & Dining'
  | 'Transportation'
  | 'Housing & Rent'
  | 'Utilities'
  | 'Shopping'
  | 'Entertainment'
  | 'Healthcare'
  | 'Education'
  | 'Travel'
  | 'Debt & EMI'
  | 'Personal Care'
  | 'Subscriptions'
  | 'Other';

export interface Transaction {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  type: TransactionType;
  category: TransactionCategory | string;
  merchant: string;
  description?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'yearly';
  paymentMethod?: 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Cash';
  taxAmount?: number;
  isAnomaly?: boolean;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  period: 'monthly' | 'custom';
  month?: string; // e.g. "2026-09"
  alertThresholdPercent?: number; // default 80
  notes?: string;
}

export type GoalHealthStatus = 'ON TRACK' | 'AT RISK' | 'BEHIND';

export interface FinancialGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  monthlyContribution: number;
  category:
    | 'Emergency Fund'
    | 'Laptop'
    | 'Car'
    | 'Travel'
    | 'Education'
    | 'House'
    | 'Investment'
    | 'Retirement'
    | 'Other';
  status: 'active' | 'completed' | 'paused';
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
}

export type AssetType =
  | 'stocks'
  | 'mutual_funds'
  | 'sips'
  | 'crypto'
  | 'gold'
  | 'other';

export interface Investment {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  investedAmount: number;
  currentValue: number;
  returnAmount: number;
  returnPercentage: number;
  notes?: string;
  lastUpdated?: string;
}

export interface DebtItem {
  id: string;
  userId: string;
  name: string;
  principal: number;
  interestRate: number; // annual % e.g. 8.75
  tenureMonths: number;
  emi: number;
  remainingBalance: number;
  startDate: string; // YYYY-MM-DD
  category:
    | 'Home Loan'
    | 'Personal Loan'
    | 'Car Loan'
    | 'Education Loan'
    | 'Credit Card'
    | 'Other';
  extraMonthlyPayment?: number;
}

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'positive';

export type AlertCategory =
  | 'budget_exceeded'
  | 'unusual_transaction'
  | 'recurring_payment'
  | 'upcoming_emi'
  | 'subscription_renewal'
  | 'low_balance'
  | 'goal_behind'
  | 'high_spending'
  | 'investment_opportunity';

export interface SmartAlert {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'danger' | 'success';
  severity?: AlertSeverity;
  category: AlertCategory;
  date: string;
  read: boolean;
  relevantAmount?: number;
  recommendedAction?: string;
  actionUrl?: string;
}

export interface SubscriptionItem {
  id: string;
  merchant: string;
  category: string;
  monthlyAmount: number;
  annualAmount: number;
  frequency: 'monthly' | 'yearly';
  nextBillingDate?: string;
  status: 'active' | 'ignored' | 'cancelled';
  reminderEnabled: boolean;
  detectedFromTransactionsCount: number;
}

export interface ProactiveInsight {
  id: string;
  title: string;
  insight: string;
  supportingData: string;
  reason: string;
  suggestedAction: string;
  severity: 'positive' | 'warning' | 'critical' | 'info';
  category: 'spending' | 'budget' | 'savings' | 'debt' | 'goals' | 'subscriptions';
}

export interface MonthlyReport {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsRate: number;
  topCategory: { name: string; amount: number; percentage: number };
  unusualSpending: Array<{ merchant: string; amount: number; reason: string }>;
  budgetPerformance: { met: number; total: number; overspentCategories: string[] };
  goalProgress: { onTrack: number; total: number };
  investmentSummary: { totalInvested: number; totalValue: number; returnRate: number };
  debtSummary: { totalRemaining: number; totalMonthlyEmi: number };
  aiObservations: string[];
  recommendations: string[];
  reviewSections?: {
    whatChanged: string[];
    whatWentWell: string[];
    whatNeedsAttention: string[];
    recommendedActions: string[];
  };
  createdAt: string;
}

export interface FactorDetail {
  score: number;
  max: number;
  valueDisplay: string;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  benchmark: string;
  tip: string;
  whyScored: string;
  howToImprove: string;
}

export interface HistoricalHealthScore {
  month: string; // e.g. "Jun", "Jul", "Aug", "Sep"
  score: number;
  rating: string;
}

export interface FinancialHealthScore {
  overallScore: number; // 0 - 100
  rating: 'Poor' | 'Fair' | 'Good' | 'Very Good' | 'Excellent';
  factors: {
    savingsRate: FactorDetail;
    budgetDiscipline: FactorDetail;
    emergencyFundCoverage: FactorDetail;
    debtBurden: FactorDetail;
    goalProgress: FactorDetail;
  };
  historicalTrend: HistoricalHealthScore[];
  summary: string;
  keyStrengths: string[];
  areasToImprove: string[];
}

export interface CashFlowForecast {
  days: 30 | 60 | 90;
  projectedBalance: number;
  expectedIncome: number;
  expectedExpenses: number;
  expectedSavings: number;
  confidence: 'High' | 'Medium' | 'Low';
  points: Array<{
    date: string;
    projectedBalance: number;
    expectedIncome: number;
    expectedExpenses: number;
  }>;
}

export interface UserFinancialSnapshot {
  transactions: Transaction[];
  budgets: Budget[];
  goals: FinancialGoal[];
  investments: Investment[];
  debts: DebtItem[];
  alerts: SmartAlert[];
  totals: {
    totalBalance: number;
    currentMonthIncome: number;
    currentMonthExpenses: number;
    netSavings: number;
    savingsRate: number;
    totalInvested: number;
    currentPortfolioValue: number;
    portfolioGain: number;
    portfolioGainPct: number;
    totalDebtRemaining: number;
    totalMonthlyEmi: number;
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    previousNetWorth: number;
    netWorthChange: number;
    netWorthChangePct: number;
    upcomingBillsCount: number;
    upcomingBillsTotal: number;
    assetDistribution: Record<string, number>;
    liabilityDistribution: Record<string, number>;
  };
}
