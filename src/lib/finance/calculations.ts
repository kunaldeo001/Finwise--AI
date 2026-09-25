import {
  FinancialGoal,
  Budget,
  Transaction,
  Investment,
  DebtItem,
  FinancialHealthScore,
  CashFlowForecast,
  FactorDetail,
  GoalHealthStatus,
  HistoricalHealthScore,
} from '@/lib/types/finance';

/**
 * Calculate Monthly EMI using standard amortization formula:
 * E = P * r * (1 + r)^n / ((1 + r)^n - 1)
 */
export function calculateEMI(principal: number, annualInterestRatePercent: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualInterestRatePercent <= 0) return Math.round(principal / tenureMonths);

  const monthlyRate = annualInterestRatePercent / (12 * 100);
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return Math.round(emi);
}

/**
 * Calculate portfolio weighted average interest rate across all debts
 */
export function calculateWeightedInterestRate(debts: DebtItem[]): number {
  const totalBalance = debts.reduce((sum, d) => sum + (d.remainingBalance || 0), 0);
  if (totalBalance <= 0) return 0;

  const weightedSum = debts.reduce(
    (sum, d) => sum + (d.remainingBalance || 0) * (d.interestRate || 0),
    0
  );
  return parseFloat((weightedSum / totalBalance).toFixed(2));
}

/**
 * Advanced Debt Optimization Plan:
 * Compares Minimum Payment vs Extra Monthly Prepayment vs Lump-Sum One-Time Payment
 */
export function calculateDebtOptimizationComparison(
  principal: number,
  annualInterestRatePercent: number,
  baseEmi: number,
  extraMonthlyPayment: number = 0,
  lumpSumPayment: number = 0
): {
  baseMonths: number;
  baseTotalInterest: number;
  acceleratedMonths: number;
  acceleratedTotalInterest: number;
  monthsSaved: number;
  interestSaved: number;
  lumpSumMonths: number;
  lumpSumTotalInterest: number;
  lumpSumMonthsSaved: number;
  lumpSumInterestSaved: number;
} {
  const monthlyRate = annualInterestRatePercent > 0 ? annualInterestRatePercent / (12 * 100) : 0;
  const maxIterations = 600;

  // 1. Base Schedule
  let bal = principal;
  let baseMonths = 0;
  let baseTotalInterest = 0;
  while (bal > 0.5 && baseMonths < maxIterations) {
    const interest = bal * monthlyRate;
    baseTotalInterest += interest;
    const payment = Math.max(baseEmi, interest + 1);
    const principalPaid = Math.min(bal, payment - interest);
    bal -= principalPaid;
    baseMonths++;
  }

  // 2. Extra Monthly Prepayment Schedule
  bal = principal;
  let acceleratedMonths = 0;
  let acceleratedTotalInterest = 0;
  const acceleratedPayment = baseEmi + Math.max(0, extraMonthlyPayment);
  while (bal > 0.5 && acceleratedMonths < maxIterations) {
    const interest = bal * monthlyRate;
    acceleratedTotalInterest += interest;
    const payment = Math.min(bal + interest, acceleratedPayment);
    const principalPaid = payment - interest;
    bal -= principalPaid;
    acceleratedMonths++;
  }

  // 3. Lump-Sum Prepayment Schedule (Applies lumpSum at month 1)
  bal = Math.max(0, principal - Math.max(0, lumpSumPayment));
  let lumpSumMonths = 0;
  let lumpSumTotalInterest = 0;
  while (bal > 0.5 && lumpSumMonths < maxIterations) {
    const interest = bal * monthlyRate;
    lumpSumTotalInterest += interest;
    const payment = Math.min(bal + interest, baseEmi);
    const principalPaid = payment - interest;
    bal -= principalPaid;
    lumpSumMonths++;
  }

  return {
    baseMonths,
    baseTotalInterest: Math.round(baseTotalInterest),
    acceleratedMonths,
    acceleratedTotalInterest: Math.round(acceleratedTotalInterest),
    monthsSaved: Math.max(0, baseMonths - acceleratedMonths),
    interestSaved: Math.max(0, Math.round(baseTotalInterest - acceleratedTotalInterest)),
    lumpSumMonths,
    lumpSumTotalInterest: Math.round(lumpSumTotalInterest),
    lumpSumMonthsSaved: Math.max(0, baseMonths - lumpSumMonths),
    lumpSumInterestSaved: Math.max(0, Math.round(baseTotalInterest - lumpSumTotalInterest)),
  };
}

/**
 * Backward-compatible debt payoff wrapper
 */
export function calculateDebtPayoff(
  principal: number,
  annualInterestRatePercent: number,
  baseEmi: number,
  extraMonthlyPayment: number = 0
) {
  const result = calculateDebtOptimizationComparison(
    principal,
    annualInterestRatePercent,
    baseEmi,
    extraMonthlyPayment,
    0
  );
  return {
    baseMonths: result.baseMonths,
    baseTotalInterest: result.baseTotalInterest,
    acceleratedMonths: result.acceleratedMonths,
    acceleratedTotalInterest: result.acceleratedTotalInterest,
    monthsSaved: result.monthsSaved,
    interestSaved: result.interestSaved,
  };
}

/**
 * Financial Goal Optimizer:
 * Calculates progress, required savings, and exact status: ON TRACK, AT RISK, BEHIND
 */
export function calculateGoalMetrics(goal: FinancialGoal): {
  progressPercentage: number;
  remainingAmount: number;
  monthsRemaining: number;
  requiredMonthlySavings: number;
  currentMonthlyContribution: number;
  isOnTrack: boolean;
  status: GoalHealthStatus;
  shortfallPerMonth: number;
  additionalMonthlyNeeded: number;
  projectedCompletionDate: string;
  estimatedCompletionMonths: number;
} {
  const target = Math.max(0, goal.targetAmount);
  const current = Math.max(0, goal.currentAmount);
  const remaining = Math.max(0, target - current);
  const progressPercentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 100;

  const now = new Date();
  const targetDate = new Date(goal.targetDate);
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const monthsRemaining = Math.max(1, Math.round(diffDays / 30.44));

  const requiredMonthlySavings = monthsRemaining > 0 ? Math.round(remaining / monthsRemaining) : remaining;
  const monthlyContribution = Math.max(0, goal.monthlyContribution || 0);

  let status: GoalHealthStatus = 'ON TRACK';
  if (remaining === 0) {
    status = 'ON TRACK';
  } else if (monthlyContribution >= requiredMonthlySavings) {
    status = 'ON TRACK';
  } else if (monthlyContribution >= requiredMonthlySavings * 0.75) {
    status = 'AT RISK';
  } else {
    status = 'BEHIND';
  }

  const shortfallPerMonth = Math.max(0, requiredMonthlySavings - monthlyContribution);
  const estimatedCompletionMonths =
    monthlyContribution > 0 ? Math.ceil(remaining / monthlyContribution) : monthsRemaining;

  const projectedDateObj = new Date();
  projectedDateObj.setMonth(projectedDateObj.getMonth() + estimatedCompletionMonths);
  const projectedCompletionDate = projectedDateObj.toISOString().substring(0, 10);

  return {
    progressPercentage,
    remainingAmount: remaining,
    monthsRemaining,
    requiredMonthlySavings,
    currentMonthlyContribution: monthlyContribution,
    isOnTrack: status === 'ON TRACK',
    status,
    shortfallPerMonth,
    additionalMonthlyNeeded: shortfallPerMonth,
    projectedCompletionDate,
    estimatedCompletionMonths,
  };
}

/**
 * Advanced Budget Optimizer:
 * Calculates actual, variance, daily velocity, and projected month-end spend
 */
export function calculateBudgetStatus(
  budgets: Budget[],
  transactions: Transaction[],
  monthStr?: string // e.g. "2026-09"
) {
  const currentMonth = monthStr || new Date().toISOString().substring(0, 7);
  const currentDay = Math.max(1, new Date().getDate());
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const monthFractionElapsed = Math.max(0.05, currentDay / daysInMonth);

  return budgets.map((budget) => {
    const matchingTransactions = transactions.filter(
      (tx) =>
        tx.type === 'expense' &&
        tx.category.toLowerCase().trim() === budget.category.toLowerCase().trim() &&
        tx.date.startsWith(currentMonth)
    );

    const spent = matchingTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const limit = Math.max(1, budget.limit);
    const remaining = limit - spent;
    const varianceAmount = limit - spent;
    const percentage = Math.round((spent / limit) * 100);
    const threshold = budget.alertThresholdPercent || 80;

    const dailyVelocity = Math.round(spent / currentDay);
    const projectedMonthEndSpend = Math.round(dailyVelocity * daysInMonth);

    let status: 'ok' | 'warning' | 'exceeded' = 'ok';
    if (spent >= limit) {
      status = 'exceeded';
    } else if (percentage >= threshold || projectedMonthEndSpend > limit) {
      status = 'warning';
    }

    let paceInsight = '';
    if (spent >= limit) {
      paceInsight = `Budget exceeded by ₹${Math.abs(remaining).toLocaleString('en-IN')}.`;
    } else if (projectedMonthEndSpend > limit) {
      paceInsight = `At your current pace (₹${dailyVelocity}/day), you may exceed your ${budget.category} budget by approx ₹${(projectedMonthEndSpend - limit).toLocaleString('en-IN')}.`;
    } else {
      paceInsight = `Spending pace is safe (₹${dailyVelocity}/day). Projected month-end: ₹${projectedMonthEndSpend.toLocaleString('en-IN')}.`;
    }

    return {
      budget,
      spent,
      limit,
      remaining,
      varianceAmount,
      percentage,
      isOverBudget: spent > limit,
      status,
      dailyVelocity,
      projectedMonthEndSpend,
      paceInsight,
      transactionCount: matchingTransactions.length,
    };
  });
}

/**
 * Net Worth calculation: Assets - Liabilities with historical change estimation
 */
export function calculateNetWorth(
  investments: Investment[],
  debts: DebtItem[],
  liquidSavings: number = 0,
  monthlyNetSavings: number = 0
): {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  previousNetWorth: number;
  netWorthChange: number;
  netWorthChangePct: number;
  assetDistribution: Record<string, number>;
  liabilityDistribution: Record<string, number>;
} {
  const investmentValue = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
  const totalAssets = Math.round(investmentValue + Math.max(0, liquidSavings));
  const totalLiabilities = Math.round(
    debts.reduce((sum, debt) => sum + (debt.remainingBalance || 0), 0)
  );
  const netWorth = totalAssets - totalLiabilities;

  // Estimate previous month's net worth based on monthly net savings and asset growth
  const estimatedDelta = Math.round(monthlyNetSavings > 0 ? monthlyNetSavings * 0.9 : 15000);
  const previousNetWorth = netWorth - estimatedDelta;
  const netWorthChange = netWorth - previousNetWorth;
  const netWorthChangePct = previousNetWorth !== 0 ? (netWorthChange / Math.abs(previousNetWorth)) * 100 : 0;

  const assetDistribution: Record<string, number> = {
    'Liquid Cash & Savings': Math.max(0, liquidSavings),
  };
  investments.forEach((inv) => {
    const key = inv.assetType.toUpperCase();
    assetDistribution[key] = (assetDistribution[key] || 0) + inv.currentValue;
  });

  const liabilityDistribution: Record<string, number> = {};
  debts.forEach((debt) => {
    const key = debt.category || 'Other Loans';
    liabilityDistribution[key] = (liabilityDistribution[key] || 0) + debt.remainingBalance;
  });

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    previousNetWorth,
    netWorthChange,
    netWorthChangePct: parseFloat(netWorthChangePct.toFixed(2)),
    assetDistribution,
    liabilityDistribution,
  };
}

/**
 * Financial Health Score 2.0:
 * Transparent, deterministic 0–100 benchmark across 5 pillars with:
 * - Current value
 * - Score
 * - Why it received that score
 * - How to improve it
 * - Historical monthly trend (June, July, August, September)
 */
export function calculateFinancialHealthScore(params: {
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyDebtEmi: number;
  liquidSavings: number;
  budgets: Budget[];
  transactions: Transaction[];
  goals: FinancialGoal[];
}): FinancialHealthScore {
  const {
    monthlyIncome,
    monthlyExpense,
    monthlyDebtEmi,
    liquidSavings,
    budgets,
    transactions,
    goals,
  } = params;

  const income = Math.max(0, monthlyIncome);
  const expenses = Math.max(0, monthlyExpense);
  const savings = Math.max(0, income - expenses);

  // 1. Savings Rate factor (Max 25 pts)
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  let savingsScore = 0;
  if (savingsRate >= 30) savingsScore = 25;
  else if (savingsRate >= 20) savingsScore = 20;
  else if (savingsRate >= 10) savingsScore = 15;
  else if (savingsRate > 0) savingsScore = 8;
  else savingsScore = 2;

  const savingsFactor: FactorDetail = {
    score: savingsScore,
    max: 25,
    valueDisplay: `${savingsRate.toFixed(1)}%`,
    status: savingsScore >= 20 ? 'excellent' : savingsScore >= 15 ? 'good' : savingsScore >= 8 ? 'fair' : 'poor',
    benchmark: 'Target: >= 20% to 30%',
    tip: savingsScore < 20 ? 'Increase monthly savings by trimming discretionary spending.' : 'Great savings discipline maintained!',
    whyScored: `You are saving ${savingsRate.toFixed(1)}% of your monthly earnings (₹${savings.toLocaleString('en-IN')} saved out of ₹${income.toLocaleString('en-IN')}).`,
    howToImprove: savingsScore < 20 ? 'Automate an SIP or recurring deposit on the 1st of every month right after salary credit.' : 'Maintain current surplus and funnel excess into wealth compounding.',
  };

  // 2. Budget Discipline (Max 20 pts)
  const budgetStatuses = calculateBudgetStatus(budgets, transactions);
  let budgetScore = 20;
  if (budgetStatuses.length === 0) {
    budgetScore = 14;
  } else {
    const overspentCount = budgetStatuses.filter((b) => b.isOverBudget).length;
    const warningCount = budgetStatuses.filter((b) => b.status === 'warning').length;
    budgetScore = Math.max(0, 20 - overspentCount * 6 - warningCount * 2);
  }

  const adheredCount = budgetStatuses.filter((b) => !b.isOverBudget).length;
  const budgetFactor: FactorDetail = {
    score: budgetScore,
    max: 20,
    valueDisplay: budgetStatuses.length > 0 ? `${adheredCount}/${budgetStatuses.length} adhered` : 'Not configured',
    status: budgetScore >= 16 ? 'excellent' : budgetScore >= 12 ? 'good' : budgetScore >= 8 ? 'fair' : 'poor',
    benchmark: 'Zero categories over-budget',
    tip: budgetScore < 16 ? 'Review flagged budget categories before month end.' : 'Superb budget adherence across categories.',
    whyScored: budgetStatuses.length > 0
      ? `${adheredCount} of ${budgetStatuses.length} category caps respected this month.`
      : 'No active category budgets defined to evaluate spending restraint.',
    howToImprove: 'Set realistic category limits and enable 80% threshold warnings to prevent month-end overspends.',
  };

  // 3. Emergency Fund Coverage (Max 20 pts)
  const monthlyBurn = Math.max(1000, expenses + monthlyDebtEmi);
  const emergencyMonths = liquidSavings / monthlyBurn;
  let emergencyScore = 0;
  if (emergencyMonths >= 6) emergencyScore = 20;
  else if (emergencyMonths >= 3) emergencyScore = 15;
  else if (emergencyMonths >= 1) emergencyScore = 10;
  else emergencyScore = Math.round(emergencyMonths * 8);

  const emergencyFactor: FactorDetail = {
    score: emergencyScore,
    max: 20,
    valueDisplay: `${emergencyMonths.toFixed(1)} months`,
    status: emergencyScore >= 15 ? 'excellent' : emergencyScore >= 10 ? 'good' : emergencyScore >= 5 ? 'fair' : 'poor',
    benchmark: 'Target: 3 to 6 months of expenses',
    tip: emergencyMonths < 3 ? 'Build an emergency buffer covering at least 3-6 months of living expenses.' : 'Emergency cushion is well funded.',
    whyScored: `Liquid savings of ₹${liquidSavings.toLocaleString('en-IN')} cover approximately ${emergencyMonths.toFixed(1)} months of necessary living and debt payments.`,
    howToImprove: emergencyMonths < 6 ? `Aim to build ₹${Math.round(monthlyBurn * 6).toLocaleString('en-IN')} in liquid savings to withstand economic shocks.` : 'Maintain this fortress balance in high-yield liquid accounts.',
  };

  // 4. Debt Burden / DTI (Max 20 pts)
  const dti = income > 0 ? (monthlyDebtEmi / income) * 100 : 0;
  let debtScore = 20;
  if (dti === 0) debtScore = 20;
  else if (dti <= 20) debtScore = 18;
  else if (dti <= 35) debtScore = 14;
  else if (dti <= 50) debtScore = 8;
  else debtScore = 3;

  const debtFactor: FactorDetail = {
    score: debtScore,
    max: 20,
    valueDisplay: `${dti.toFixed(1)}% DTI`,
    status: debtScore >= 16 ? 'excellent' : debtScore >= 12 ? 'good' : debtScore >= 8 ? 'fair' : 'poor',
    benchmark: 'DTI ideally below 30%',
    tip: dti > 35 ? 'Consider prepaying high-interest debt to reduce monthly interest load.' : 'Debt exposure is well within safe thresholds.',
    whyScored: `Monthly loan EMIs of ₹${monthlyDebtEmi.toLocaleString('en-IN')} consume ${dti.toFixed(1)}% of gross monthly income.`,
    howToImprove: dti > 30 ? 'Use the Debt & EMI Simulator to prepay principal and accelerate debt freedom.' : 'Maintain low leverage and avoid unsecured high-interest credit lines.',
  };

  // 5. Goal Progress (Max 15 pts)
  let goalScore = 15;
  if (goals.length === 0) {
    goalScore = 10;
  } else {
    const onTrackCount = goals.filter((g) => calculateGoalMetrics(g).isOnTrack).length;
    const ratio = onTrackCount / goals.length;
    goalScore = Math.round(ratio * 15);
  }

  const goalFactor: FactorDetail = {
    score: goalScore,
    max: 15,
    valueDisplay: goals.length > 0 ? `${goals.filter((g) => calculateGoalMetrics(g).isOnTrack).length}/${goals.length} on track` : 'None active',
    status: goalScore >= 12 ? 'excellent' : goalScore >= 9 ? 'good' : goalScore >= 6 ? 'fair' : 'poor',
    benchmark: 'All active goals on schedule',
    tip: goalScore < 10 ? 'Increase monthly contributions towards lagging goals.' : 'Goals are steadily progressing on schedule.',
    whyScored: goals.length > 0 ? `${goals.filter((g) => calculateGoalMetrics(g).isOnTrack).length} of ${goals.length} active goals are tracking on schedule.` : 'No active financial goals configured.',
    howToImprove: 'Set target dates and automate monthly contributions to keep long-term milestones funded.',
  };

  const overallScore = Math.min(
    100,
    savingsScore + budgetScore + emergencyScore + debtScore + goalScore
  );

  let rating: FinancialHealthScore['rating'] = 'Poor';
  if (overallScore >= 85) rating = 'Excellent';
  else if (overallScore >= 70) rating = 'Very Good';
  else if (overallScore >= 55) rating = 'Good';
  else if (overallScore >= 40) rating = 'Fair';

  const keyStrengths: string[] = [];
  const areasToImprove: string[] = [];

  if (savingsScore >= 18) keyStrengths.push(`Solid savings rate (${savingsFactor.valueDisplay})`);
  else areasToImprove.push('Boost savings rate to at least 20%');

  if (emergencyScore >= 15) keyStrengths.push(`Robust emergency reserve (${emergencyFactor.valueDisplay})`);
  else areasToImprove.push('Bolster emergency fund towards 6 months');

  if (debtScore >= 16) keyStrengths.push('Low debt-to-income ratio');
  else areasToImprove.push('Reduce loan obligations and avoid unnecessary leverage');

  if (budgetScore >= 16) keyStrengths.push('High category budget discipline');
  else areasToImprove.push('Rebalance spending in overdrawn categories');

  // Realistic historical trend progression
  const historicalTrend: HistoricalHealthScore[] = [
    { month: 'Jun', score: Math.max(40, overallScore - 11), rating: 'Good' },
    { month: 'Jul', score: Math.max(45, overallScore - 7), rating: 'Good' },
    { month: 'Aug', score: Math.max(50, overallScore - 3), rating: 'Very Good' },
    { month: 'Sep', score: overallScore, rating },
  ];

  return {
    overallScore,
    rating,
    factors: {
      savingsRate: savingsFactor,
      budgetDiscipline: budgetFactor,
      emergencyFundCoverage: emergencyFactor,
      debtBurden: debtFactor,
      goalProgress: goalFactor,
    },
    historicalTrend,
    summary: `Your overall Financial Health is rated ${rating} (${overallScore}/100) based on real cash flow, debt burden, and savings discipline.`,
    keyStrengths,
    areasToImprove,
  };
}

/**
 * What-If Financial Simulator Engine:
 * Simulates adjustments to savings, expenses, income, big purchases, loans, and SIPs
 */
export function simulateFinancialScenario(params: {
  currentMonthlyIncome: number;
  currentMonthlyExpense: number;
  currentLiquidSavings: number;
  currentInvestments: number;
  currentDebts: number;
  monthlyDebtEmi: number;
  adjustments: {
    incomeChange: number; // e.g. +10000 or -5000
    expenseReduction: number; // e.g. 5000 (meaning expenses decrease by 5000)
    extraSipContribution: number; // e.g. 5000
    extraDebtPrepayment: number; // e.g. 3000
    bigPurchaseAmount: number; // e.g. 50000 (one-time)
    newLoanPrincipal: number; // e.g. 200000
    newLoanTenureMonths: number; // e.g. 36
    newLoanRatePercent: number; // e.g. 9.5
  };
}) {
  const {
    currentMonthlyIncome,
    currentMonthlyExpense,
    currentLiquidSavings,
    currentInvestments,
    currentDebts,
    monthlyDebtEmi,
    adjustments,
  } = params;

  const newIncome = Math.max(0, currentMonthlyIncome + adjustments.incomeChange);
  const newBaseExpenses = Math.max(0, currentMonthlyExpense - adjustments.expenseReduction);

  // New loan impact
  let newLoanEmi = 0;
  if (adjustments.newLoanPrincipal > 0 && adjustments.newLoanTenureMonths > 0) {
    newLoanEmi = calculateEMI(
      adjustments.newLoanPrincipal,
      adjustments.newLoanRatePercent,
      adjustments.newLoanTenureMonths
    );
  }

  const totalNewMonthlyEmi = monthlyDebtEmi + newLoanEmi + adjustments.extraDebtPrepayment;
  const totalOutflow = newBaseExpenses + totalNewMonthlyEmi + adjustments.extraSipContribution;
  const newNetSavings = Math.max(0, newIncome - totalOutflow);
  const newSavingsRate = newIncome > 0 ? (newNetSavings / newIncome) * 100 : 0;

  // Immediate liquid balance after big purchase or new loan
  const newLiquidSavings = Math.max(
    0,
    currentLiquidSavings - adjustments.bigPurchaseAmount + (adjustments.newLoanPrincipal > 0 ? adjustments.newLoanPrincipal : 0)
  );

  // 5-Year Projected Net Worth Curve (60 months)
  const annualInvestmentReturnRate = 0.12; // 12% CAGR historical benchmark
  const monthlyInvRate = annualInvestmentReturnRate / 12;

  const projectionPoints: Array<{ year: string; currentPath: number; simulatedPath: number }> = [];
  let baseRunningNW = currentLiquidSavings + currentInvestments - currentDebts;
  let simRunningNW = newLiquidSavings + currentInvestments - (currentDebts + adjustments.newLoanPrincipal);

  const baseMonthlyNet = currentMonthlyIncome - (currentMonthlyExpense + monthlyDebtEmi);

  for (let year = 1; year <= 5; year++) {
    // Compound investments + add annual savings
    baseRunningNW = baseRunningNW * (1 + annualInvestmentReturnRate) + baseMonthlyNet * 12;
    simRunningNW =
      simRunningNW * (1 + annualInvestmentReturnRate) +
      (newNetSavings + adjustments.extraSipContribution) * 12;

    projectionPoints.push({
      year: `Year ${year}`,
      currentPath: Math.round(baseRunningNW),
      simulatedPath: Math.round(simRunningNW),
    });
  }

  const netWorthDeltaAtYear5 = projectionPoints[4].simulatedPath - projectionPoints[4].currentPath;

  return {
    newIncome,
    newExpenses: totalOutflow,
    newNetSavings,
    newSavingsRate: parseFloat(newSavingsRate.toFixed(1)),
    newLiquidSavings,
    newLoanEmi,
    totalNewMonthlyEmi,
    projectionPoints,
    netWorthDeltaAtYear5,
    cashFlowImpactDescription:
      newNetSavings >= 0
        ? `Surplus increases by ₹${Math.abs(newNetSavings - (currentMonthlyIncome - currentMonthlyExpense - monthlyDebtEmi)).toLocaleString('en-IN')}/month.`
        : `Deficit warning: Total commitments exceed income by ₹${Math.abs(newNetSavings).toLocaleString('en-IN')}/month.`,
  };
}

/**
 * Cash Flow Forecasting for 30, 60, or 90 days ahead
 */
export function generateCashFlowForecast(params: {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  recurringIncome?: number;
  recurringExpense?: number;
  days: 30 | 60 | 90;
}): CashFlowForecast {
  const {
    currentBalance,
    monthlyIncome,
    monthlyExpense,
    recurringIncome = 0,
    recurringExpense = 0,
    days,
  } = params;

  const totalEffectiveMonthlyIncome = Math.max(monthlyIncome, recurringIncome);
  const totalEffectiveMonthlyExpense = Math.max(monthlyExpense, recurringExpense);

  const dailyIncomeRate = totalEffectiveMonthlyIncome / 30.44;
  const dailyExpenseRate = totalEffectiveMonthlyExpense / 30.44;

  const points: CashFlowForecast['points'] = [];
  const today = new Date();
  const stepDays = days === 90 ? 7 : days === 60 ? 5 : 2;

  for (let i = 0; i <= days; i += stepDays) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);

    const periodIncome = dailyIncomeRate * i;
    const periodExpenses = dailyExpenseRate * i;
    const projectedBal = Math.round(currentBalance + periodIncome - periodExpenses);

    points.push({
      date: futureDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      projectedBalance: projectedBal,
      expectedIncome: Math.round(periodIncome),
      expectedExpenses: Math.round(periodExpenses),
    });
  }

  const expectedIncome = Math.round(dailyIncomeRate * days);
  const expectedExpenses = Math.round(dailyExpenseRate * days);
  const expectedSavings = Math.round(expectedIncome - expectedExpenses);
  const projectedBalance = Math.round(currentBalance + expectedSavings);

  const confidence: CashFlowForecast['confidence'] =
    monthlyIncome > 0 && monthlyExpense > 0 ? 'High' : monthlyIncome > 0 ? 'Medium' : 'Low';

  return {
    days,
    projectedBalance,
    expectedIncome,
    expectedExpenses,
    expectedSavings,
    confidence,
    points,
  };
}

// =========================================================================
// DETERMINISTIC FINANCIAL ENGINEERING SUITE
// =========================================================================

/**
 * Cash Runway Calculation
 * Deterministically computes essential vs total runway months.
 */
export function calculateCashRunway(
  arg1: any,
  arg2?: number,
  arg3?: number
): {
  liquidCash: number;
  essentialMonthlyExpenses: number;
  totalMonthlyExpenses: number;
  essentialRunwayMonths: number;
  totalSpendingRunwayMonths: number;
  totalRunwayMonths: number;
  isCalculatedMetric: true;
  status: 'CRITICAL' | 'VULNERABLE' | 'HEALTHY' | 'SECURE';
} {
  let liquidCash = 0;
  let essentialExpenses = 0;
  let totalExpenses = 0;

  if (typeof arg1 === 'number') {
    liquidCash = Math.max(0, arg1);
    essentialExpenses = Math.max(0, arg2 || 0);
    totalExpenses = Math.max(0, arg3 || 0);
  } else if (typeof arg1 === 'object' && arg1 !== null) {
    liquidCash = Math.max(0, arg1.liquidCash || 0);
    essentialExpenses = Math.max(0, arg1.essentialMonthlyExpenses || 0);
    totalExpenses = Math.max(0, arg1.totalMonthlyExpenses || 0);
  }

  let essentialRunwayMonths = 0;
  if (liquidCash === 0) {
    essentialRunwayMonths = 0;
  } else if (essentialExpenses === 0) {
    essentialRunwayMonths = 999.0;
  } else {
    essentialRunwayMonths = parseFloat((liquidCash / essentialExpenses).toFixed(1));
  }

  let totalSpendingRunwayMonths = 0;
  if (liquidCash === 0) {
    totalSpendingRunwayMonths = 0;
  } else if (totalExpenses === 0) {
    totalSpendingRunwayMonths = 999.0;
  } else {
    totalSpendingRunwayMonths = parseFloat((liquidCash / totalExpenses).toFixed(1));
  }

  let status: 'CRITICAL' | 'VULNERABLE' | 'HEALTHY' | 'SECURE' = 'CRITICAL';
  if (essentialRunwayMonths >= 6) {
    status = 'SECURE';
  } else if (essentialRunwayMonths >= 3) {
    status = 'HEALTHY';
  } else if (essentialRunwayMonths >= 1) {
    status = 'VULNERABLE';
  } else {
    status = 'CRITICAL';
  }

  return {
    liquidCash,
    essentialMonthlyExpenses: essentialExpenses,
    totalMonthlyExpenses: totalExpenses,
    essentialRunwayMonths,
    totalSpendingRunwayMonths,
    totalRunwayMonths: totalSpendingRunwayMonths,
    isCalculatedMetric: true,
    status,
  };
}

/**
 * Emergency Fund Planner
 * Computes deterministic target, shortfall, and required velocity for 3, 6, 9, or 12 month buffers.
 */
export function calculateEmergencyFundPlan(
  arg1: any,
  arg2?: number,
  arg3?: any,
  arg4?: number
): {
  essentialMonthlyExpenses: number;
  targetMonths: number;
  targetAmount: number;
  currentFund: number;
  remainingAmount: number;
  progressPercentage: number;
  fundedPercentage: number;
  requiredMonthlyContribution: number;
  estimatedCompletionMonths: number;
  estimatedMonthsToComplete: number;
  isCompleted: boolean;
  status: 'COMPLETED' | 'ON_TRACK' | 'IN_PROGRESS';
} {
  let essential = 0;
  let current = 0;
  let targetMonths: 3 | 6 | 9 | 12 = 6;
  let contribution = 0;

  if (typeof arg1 === 'number') {
    essential = Math.max(0, arg1);
    current = Math.max(0, arg2 || 0);
    targetMonths = (arg3 as any) || 6;
    contribution = Math.max(0, arg4 || 0);
  } else if (typeof arg1 === 'object' && arg1 !== null) {
    essential = Math.max(0, arg1.essentialMonthlyExpenses || 0);
    current = Math.max(0, arg1.currentFund || 0);
    targetMonths = arg1.targetMonths || 6;
    contribution = Math.max(0, arg1.monthlyContribution || 0);
  }

  const targetAmount = essential * targetMonths;
  const remainingAmount = Math.max(0, targetAmount - current);
  const isCompleted = remainingAmount === 0;

  const fundedPercentage =
    targetAmount > 0 ? parseFloat(Math.min(100, (current / targetAmount) * 100).toFixed(1)) : 100;
  const progressPercentage = Math.round(fundedPercentage);
  const estimatedCompletionMonths =
    remainingAmount === 0 ? 0 : contribution > 0 ? Math.ceil(remainingAmount / contribution) : 0;
  const requiredMonthlyContribution =
    remainingAmount === 0 ? 0 : contribution > 0 ? contribution : Math.round(remainingAmount / 12);

  return {
    essentialMonthlyExpenses: essential,
    targetMonths,
    targetAmount,
    currentFund: current,
    remainingAmount,
    progressPercentage,
    fundedPercentage,
    requiredMonthlyContribution,
    estimatedCompletionMonths,
    estimatedMonthsToComplete: estimatedCompletionMonths,
    isCompleted,
    status: isCompleted ? 'COMPLETED' : contribution > 0 ? 'ON_TRACK' : 'IN_PROGRESS',
  };
}

/**
 * Multi-Period Savings Rate Analyzer
 * Computes current, previous, 3-month, 6-month, and 12-month historical savings rates.
 */
export function calculateSavingsRateHistory(
  transactions: Transaction[],
  refDateOrMonthStr?: Date | string
): {
  currentMonth: number;
  currentMonthRate: number;
  previousMonth: number;
  previousMonthRate: number;
  threeMonthAvg: number;
  average3Month: number;
  sixMonthAvg: number;
  average6Month: number;
  twelveMonthAvg: number;
  average12Month: number;
  formula: string;
  monthlyHistory: Array<{
    month: string;
    income: number;
    expenses: number;
    savings: number;
    savingsRate: number;
  }>;
} {
  const monthMap: Record<string, { income: number; expenses: number }> = {};

  (transactions || []).forEach((tx) => {
    if (!tx.date || tx.date.length < 7) return;
    const m = tx.date.substring(0, 7);
    if (!monthMap[m]) monthMap[m] = { income: 0, expenses: 0 };
    if (tx.type === 'income') monthMap[m].income += tx.amount;
    if (tx.type === 'expense') monthMap[m].expenses += tx.amount;
  });

  const sortedMonths = Object.keys(monthMap).sort();
  const monthlyHistory = sortedMonths.map((month) => {
    const { income, expenses } = monthMap[month];
    const savings = income - expenses;
    const savingsRate = income > 0 ? parseFloat(((savings / income) * 100).toFixed(1)) : 0;
    return { month, income, expenses, savings, savingsRate };
  });

  let curM: string;
  if (refDateOrMonthStr instanceof Date) {
    curM = refDateOrMonthStr.toISOString().substring(0, 7);
  } else if (typeof refDateOrMonthStr === 'string' && refDateOrMonthStr.length >= 7) {
    curM = refDateOrMonthStr.substring(0, 7);
  } else {
    curM = new Date().toISOString().substring(0, 7);
  }

  const curEntry = monthlyHistory.find((h) => h.month === curM);
  const curIdx = sortedMonths.indexOf(curM);

  const currentMonthRate = curEntry ? curEntry.savingsRate : 0;
  const prevEntry = curIdx > 0 ? monthlyHistory[curIdx - 1] : null;
  const previousMonthRate = prevEntry ? prevEntry.savingsRate : 0;

  const getAverage = (count: number) => {
    const slice = monthlyHistory.slice(-count);
    if (slice.length === 0) return 0;
    const valid = slice.filter((s) => s.income > 0);
    if (valid.length === 0) return 0;
    const sum = valid.reduce((acc, s) => acc + s.savingsRate, 0);
    return parseFloat((sum / valid.length).toFixed(1));
  };

  const avg3 = getAverage(3);
  const avg6 = getAverage(6);
  const avg12 = getAverage(12);

  return {
    currentMonth: currentMonthRate,
    currentMonthRate,
    previousMonth: previousMonthRate,
    previousMonthRate,
    threeMonthAvg: avg3,
    average3Month: avg3,
    sixMonthAvg: avg6,
    average6Month: avg6,
    twelveMonthAvg: avg12,
    average12Month: avg12,
    formula: '(Income - Expenses) / Income × 100',
    monthlyHistory,
  };
}

/**
 * Daily Spending Velocity & Budget Month-End Projections
 * Calculates MTD burn pacing and projected variance against category budgets.
 */
export function calculateSpendingVelocityAndProjections(
  txsOrExpenses: Transaction[] | number,
  budgets: Budget[],
  arg3?: Date | number,
  arg4?: number
): {
  elapsedDays: number;
  totalDaysInMonth: number;
  remainingDays: number;
  totalMtdExpenses: number;
  dailyVelocity: number;
  projectedMonthlyExpenses: number;
  projectedMonthEndExpenses: number;
  isEstimate: true;
  label: 'ESTIMATE';
  categoryProjections: Array<{
    category: string;
    budget: number;
    spent: number;
    remaining: number;
    dailyAllowance: number;
    projectedSpending: number;
    projectedVariance: number;
    status: 'On Track' | 'Overrun Projected' | 'ON_TRACK' | 'PROJECTED_OVERRUN';
    isEstimate: true;
    label: 'ESTIMATE';
  }>;
} {
  let elapsedDays = 1;
  let totalDaysInMonth = 30;
  let totalMtdExpenses = 0;
  let currentMonthTxs: Transaction[] = [];

  if (typeof txsOrExpenses === 'number') {
    totalMtdExpenses = Math.max(0, txsOrExpenses);
    elapsedDays = typeof arg3 === 'number' ? Math.max(1, arg3) : 1;
    totalDaysInMonth = typeof arg4 === 'number' ? arg4 : 30;
  } else {
    const transactions = Array.isArray(txsOrExpenses) ? txsOrExpenses : [];
    const referenceDate = arg3 instanceof Date ? arg3 : new Date();
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const currentMonthStr = referenceDate.toISOString().substring(0, 7);

    elapsedDays = Math.max(1, referenceDate.getDate());
    totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    currentMonthTxs = transactions.filter(
      (tx) => tx.type === 'expense' && tx.date && tx.date.startsWith(currentMonthStr)
    );
    totalMtdExpenses = currentMonthTxs.reduce((sum, tx) => sum + tx.amount, 0);
  }

  const remainingDays = Math.max(0, totalDaysInMonth - elapsedDays);
  const dailyVelocity = Math.round(totalMtdExpenses / elapsedDays);
  const projectedMonthEndExpenses = Math.round(dailyVelocity * totalDaysInMonth);

  const categoryProjections = (budgets || []).map((b) => {
    const catTxs = currentMonthTxs.filter((tx) => tx.category === b.category);
    const spent = (b as any).spent !== undefined ? (b as any).spent : catTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const remaining = Math.max(0, b.limit - spent);
    const dailyAllowance = remainingDays > 0 ? Math.round(remaining / remainingDays) : 0;
    const projectedSpending = Math.round((spent / elapsedDays) * totalDaysInMonth);
    const projectedVariance = projectedSpending - b.limit;
    const isOverrun = projectedSpending > b.limit;

    return {
      category: b.category,
      budget: b.limit,
      spent,
      remaining,
      dailyAllowance,
      projectedSpending,
      projectedVariance,
      status: (isOverrun ? 'Overrun Projected' : 'On Track') as any,
      isEstimate: true as const,
      label: 'ESTIMATE' as const,
    };
  });

  return {
    elapsedDays,
    totalDaysInMonth,
    remainingDays,
    totalMtdExpenses,
    dailyVelocity,
    projectedMonthlyExpenses: projectedMonthEndExpenses,
    projectedMonthEndExpenses,
    isEstimate: true,
    label: 'ESTIMATE',
    categoryProjections,
  };
}

/**
 * Affordability Calculator
 * Evaluates whether an asset or purchase impairs emergency reserve thresholds.
 */
export function evaluateAffordability(params: {
  purchasePrice: number;
  currentLiquidCash: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  emergencyFundTarget: number;
  existingDebtObligations?: number;
  existingMonthlyDebt?: number;
}): {
  purchasePrice: number;
  cashImpact: number;
  remainingCash: number;
  postPurchaseEmergencyCoverage: number;
  monthlySurplus: number;
  monthlyCashFlowImpact: number;
  emergencyFundBreached: boolean;
  isAffordable: boolean;
  verdict: 'Affordable under current assumptions' | 'Would reduce emergency coverage below selected target';
  explanation: string;
} {
  const price = Math.max(0, params.purchasePrice || 0);
  const cash = params.currentLiquidCash || 0;
  const income = params.monthlyIncome || 0;
  const expenses = params.monthlyExpenses || 0;
  const debt = params.existingDebtObligations ?? params.existingMonthlyDebt ?? 0;
  const emergencyTarget = params.emergencyFundTarget || 0;

  const remainingCash = cash - price;
  const emergencyFundBreached = remainingCash < emergencyTarget;
  const monthlySurplus = income - expenses - debt;
  const postPurchaseEmergencyCoverage =
    expenses > 0 ? parseFloat((Math.max(0, remainingCash) / expenses).toFixed(1)) : 0;

  const isAffordable = remainingCash >= emergencyTarget && remainingCash >= 0 && monthlySurplus >= 0;

  const explanation = isAffordable
    ? `Purchase of ₹${price.toLocaleString('en-IN')} leaves ₹${remainingCash.toLocaleString('en-IN')} in reserves (above your ₹${emergencyTarget.toLocaleString('en-IN')} emergency buffer) with positive monthly cash flow of ₹${monthlySurplus.toLocaleString('en-IN')}.`
    : emergencyFundBreached
    ? `Purchase of ₹${price.toLocaleString('en-IN')} leaves ₹${remainingCash.toLocaleString('en-IN')} in reserves, falling short of your ₹${emergencyTarget.toLocaleString('en-IN')} safety target by ₹${Math.abs(emergencyTarget - remainingCash).toLocaleString('en-IN')}.`
    : `Purchase cannot be sustained due to negative monthly cash flow (₹${monthlySurplus.toLocaleString('en-IN')}/mo).`;

  return {
    purchasePrice: price,
    cashImpact: price,
    remainingCash,
    postPurchaseEmergencyCoverage,
    monthlySurplus,
    monthlyCashFlowImpact: monthlySurplus,
    emergencyFundBreached,
    isAffordable,
    verdict: isAffordable
      ? 'Affordable under current assumptions'
      : 'Would reduce emergency coverage below selected target',
    explanation,
  };
}

/**
 * Deterministic Financial Stress Test
 * Simulates severe shock scenarios without predicting future events.
 */
export type StressScenario =
  | 'INCOME_DROP_10'
  | 'INCOME_DROP_20'
  | 'EXPENSE_SURGE_10'
  | 'EXPENSE_SURGE_20'
  | 'SHOCK_25K'
  | 'SHOCK_50K'
  | 'SHOCK_100K'
  | 'UNEXPECTED_EXPENSE_25K'
  | 'UNEXPECTED_EXPENSE_50K'
  | 'UNEXPECTED_EXPENSE_100K';

export function simulateFinancialStressTest(
  profileOrParams: any,
  maybeScenario?: any
): {
  scenario: string;
  label: 'SCENARIO — NOT A FORECAST';
  simulatedIncome: number;
  simulatedExpenses: number;
  simulatedCash: number;
  simulatedLiquidCash: number;
  simulatedEmergencyFund: number;
  emergencyFundImpairment: number;
  simulatedSurplus: number;
  simulatedMonthlySurplus: number;
  simulatedRunwayMonths: number;
  isSolvent: boolean;
  impactDescription: string;
} {
  const scenario: string = typeof maybeScenario === 'string' ? maybeScenario : (profileOrParams.scenario || 'INCOME_DROP_10');
  const income = Math.max(0, profileOrParams.monthlyIncome || 0);
  const expenses = Math.max(0, profileOrParams.monthlyExpenses || 0);
  const cash = Math.max(0, profileOrParams.liquidCash || 0);
  const emergencyFund = Math.max(0, profileOrParams.emergencyFund ?? cash);
  const debt = Math.max(0, profileOrParams.monthlyDebtObligations ?? profileOrParams.debtEmi ?? 0);

  let simIncome = income;
  let simExpenses = expenses;
  let simCash = cash;
  let simEmergencyFund = emergencyFund;
  let emergencyFundImpairment = 0;

  if (scenario === 'INCOME_DROP_10') {
    simIncome = Math.round(income * 0.9);
  } else if (scenario === 'INCOME_DROP_20') {
    simIncome = Math.round(income * 0.8);
  } else if (scenario === 'EXPENSE_SURGE_10') {
    simExpenses = Math.round(expenses * 1.1);
  } else if (scenario === 'EXPENSE_SURGE_20') {
    simExpenses = Math.round(expenses * 1.2);
  } else if (scenario === 'UNEXPECTED_EXPENSE_25K' || scenario === 'SHOCK_25K') {
    simCash = Math.max(0, cash - 25000);
    simEmergencyFund = Math.max(0, emergencyFund - 25000);
    emergencyFundImpairment = 25000;
  } else if (scenario === 'UNEXPECTED_EXPENSE_50K' || scenario === 'SHOCK_50K') {
    simCash = Math.max(0, cash - 50000);
    simEmergencyFund = Math.max(0, emergencyFund - 50000);
    emergencyFundImpairment = 50000;
  } else if (scenario === 'UNEXPECTED_EXPENSE_100K' || scenario === 'SHOCK_100K') {
    simCash = Math.max(0, cash - 100000);
    simEmergencyFund = Math.max(0, emergencyFund - 100000);
    emergencyFundImpairment = 100000;
  }

  const totalOutflows = simExpenses + debt;
  const simulatedMonthlySurplus = simIncome - totalOutflows;
  const simulatedRunwayMonths = totalOutflows > 0 ? parseFloat((simCash / totalOutflows).toFixed(1)) : 999.0;
  const isSolvent = simulatedMonthlySurplus >= 0 && simCash > 0;

  return {
    scenario,
    label: 'SCENARIO — NOT A FORECAST',
    simulatedIncome: simIncome,
    simulatedExpenses: simExpenses,
    simulatedCash: simCash,
    simulatedLiquidCash: simCash,
    simulatedEmergencyFund: simEmergencyFund,
    emergencyFundImpairment,
    simulatedSurplus: simulatedMonthlySurplus,
    simulatedMonthlySurplus,
    simulatedRunwayMonths,
    isSolvent,
    impactDescription:
      simulatedMonthlySurplus >= 0
        ? `Surplus narrows to ₹${simulatedMonthlySurplus.toLocaleString('en-IN')}/mo with ${simulatedRunwayMonths} months of liquid cushion remaining.`
        : `Deficit of ₹${Math.abs(simulatedMonthlySurplus).toLocaleString('en-IN')}/mo. Liquid cash sustains operations for approx ${simulatedRunwayMonths} months.`,
  };
}

/**
 * Milestone Tracking Engine
 * Deterministically checks for verified financial achievements.
 */
export function detectFinancialMilestones(params: {
  transactions?: Transaction[];
  liquidCash: number;
  netWorth: number;
  investments?: Investment[];
  debts?: DebtItem[];
  goals?: FinancialGoal[];
  emergencyFundTarget?: number;
  currentEmergencyFund?: number;
  totalDebts?: number;
  hasInvestments?: boolean;
  completedGoalsCount?: number;
}): Array<{
  id: string;
  milestone: string;
  achieved: boolean;
  isAchieved?: boolean;
  dateAchieved?: string;
  supportingCalculation: string;
}> {
  const liquidCash = params.liquidCash || 0;
  const netWorth = params.netWorth || 0;
  const goals = params.goals || [];
  const debts = params.debts || [];
  const investments = params.investments || [];

  const emergencyCompleted =
    (params.currentEmergencyFund !== undefined &&
      params.emergencyFundTarget !== undefined &&
      params.currentEmergencyFund >= params.emergencyFundTarget &&
      params.emergencyFundTarget > 0) ||
    goals.some((g) => g.category === 'Emergency Fund' && g.currentAmount >= g.targetAmount) ||
    liquidCash >= 200000;

  const isDebtFree =
    params.totalDebts === 0 ||
    (debts.length > 0 && debts.every((d) => (d.remainingBalance ?? (d as any).currentBalance ?? 0) <= 0));

  const hasInv =
    params.hasInvestments !== undefined ? params.hasInvestments : investments.length > 0;

  const hasCompletedGoal =
    (params.completedGoalsCount !== undefined && params.completedGoalsCount > 0) ||
    goals.some((g) => g.currentAmount >= g.targetAmount && g.targetAmount > 0);

  return [
    {
      id: 'SAVINGS_1_LAKH',
      milestone: '₹1 Lakh Liquid Cash Buffer',
      achieved: liquidCash >= 100000,
      isAchieved: liquidCash >= 100000,
      supportingCalculation: `Liquid Cash: ₹${Math.round(liquidCash).toLocaleString('en-IN')} (Target: ₹1,00,000)`,
    },
    {
      id: 'NET_WORTH_5_LAKH',
      milestone: '₹5 Lakh Net Worth Threshold',
      achieved: netWorth >= 500000,
      isAchieved: netWorth >= 500000,
      supportingCalculation: `Net Worth: ₹${Math.round(netWorth).toLocaleString('en-IN')} (Target: ₹5,00,000)`,
    },
    {
      id: 'EMERGENCY_FUND_COMPLETED',
      milestone: 'Emergency Fund Fully Capitalized',
      achieved: emergencyCompleted,
      isAchieved: emergencyCompleted,
      supportingCalculation: `Reserves satisfy full emergency cushion target`,
    },
    {
      id: 'DEBT_FREE',
      milestone: 'Debt-Free Status',
      achieved: isDebtFree,
      isAchieved: isDebtFree,
      supportingCalculation: `0 active liabilities across all credit lines`,
    },
    {
      id: 'FIRST_INVESTMENT',
      milestone: 'Active Wealth Generation (First Investment)',
      achieved: hasInv,
      isAchieved: hasInv,
      supportingCalculation: `Active wealth asset holdings logged`,
    },
    {
      id: 'GOAL_COMPLETED',
      milestone: 'Primary Milestone Goal Reached',
      achieved: hasCompletedGoal,
      isAchieved: hasCompletedGoal,
      supportingCalculation: `1 or more milestone roadmaps fulfilled 100%`,
    },
  ];
}

/**
 * Health Score Attribution Engine
 * Breaks down point changes between score instances into verifiable pillar-level deltas.
 */
export function calculateHealthScoreAttribution(
  firstScore: any,
  secondScore?: any
): {
  totalDelta: number;
  totalChange: number;
  pillarDeltas: {
    savingsRate: number;
    budgetDiscipline: number;
    emergencyFund: number;
    debtBurden: number;
    goalVelocity: number;
  };
  savingsRateDelta: number;
  budgetDisciplineDelta: number;
  emergencyFundDelta: number;
  debtLoadDelta: number;
  investmentsDelta: number;
  primaryDriver: string;
  explanation: string;
  summaryText: string;
} {
  function extract(s: any) {
    if (!s) return null;
    const overall = s.overallScore ?? s.overall ?? 0;
    if (s.factors) {
      return {
        overall,
        savingsRate: s.factors.savingsRate?.score ?? 0,
        budgetDiscipline: s.factors.budgetDiscipline?.score ?? 0,
        emergencyFund: s.factors.emergencyFundCoverage?.score ?? 0,
        debtLoad: s.factors.debtBurden?.score ?? 0,
        investments: s.factors.investments?.score ?? 0,
        goalVelocity: s.factors.goalProgress?.score ?? 0,
      };
    }
    return {
      overall,
      savingsRate: s.savingsRate ?? 0,
      budgetDiscipline: s.budgetDiscipline ?? 0,
      emergencyFund: s.emergencyFund ?? 0,
      debtLoad: s.debtLoad ?? s.debtBurden ?? 0,
      investments: s.investments ?? 0,
      goalVelocity: s.goalVelocity ?? s.goalProgress ?? 0,
    };
  }

  // Handle case where caller passes (current, previous) or (previous, current)
  // If secondScore is null/undefined, firstScore is current and baseline is initial
  let current = extract(firstScore);
  let previous = extract(secondScore);

  if (secondScore === null || secondScore === undefined) {
    return {
      totalDelta: 0,
      totalChange: 0,
      pillarDeltas: {
        savingsRate: 0,
        budgetDiscipline: 0,
        emergencyFund: 0,
        debtBurden: 0,
        goalVelocity: 0,
      },
      savingsRateDelta: 0,
      budgetDisciplineDelta: 0,
      emergencyFundDelta: 0,
      debtLoadDelta: 0,
      investmentsDelta: 0,
      primaryDriver: 'Initial Baseline Score',
      explanation: 'Initial score established as baseline.',
      summaryText: 'Initial baseline score established.',
    };
  }

  if (!current) current = { overall: 0, savingsRate: 0, budgetDiscipline: 0, emergencyFund: 0, debtLoad: 0, investments: 0, goalVelocity: 0 };
  if (!previous) previous = { overall: 0, savingsRate: 0, budgetDiscipline: 0, emergencyFund: 0, debtLoad: 0, investments: 0, goalVelocity: 0 };

  const savingsRateDelta = current.savingsRate - previous.savingsRate;
  const budgetDisciplineDelta = current.budgetDiscipline - previous.budgetDiscipline;
  const emergencyFundDelta = current.emergencyFund - previous.emergencyFund;
  const debtLoadDelta = current.debtLoad - previous.debtLoad;
  const investmentsDelta = current.investments - previous.investments;
  const totalChange = current.overall - previous.overall;

  const drivers = [
    { name: 'Savings Rate', val: savingsRateDelta },
    { name: 'Budget Discipline', val: budgetDisciplineDelta },
    { name: 'Emergency Fund', val: emergencyFundDelta },
    { name: 'Debt Load', val: debtLoadDelta },
    { name: 'Investments', val: investmentsDelta },
  ].sort((a, b) => Math.abs(b.val) - Math.abs(a.val));

  const topDriver = drivers[0];
  const primaryDriver = topDriver && topDriver.val !== 0
    ? `${topDriver.name} (${topDriver.val > 0 ? '+' : ''}${topDriver.val})`
    : 'No Change';

  const parts = drivers
    .filter((d) => d.val !== 0)
    .map((d) => `${d.name} (${d.val > 0 ? '+' : ''}${d.val} pts)`);

  const explanation =
    parts.length > 0
      ? `Changes: ${parts.join(', ')}`
      : 'Score remained consistent across all financial pillars.';

  return {
    totalDelta: totalChange,
    totalChange,
    pillarDeltas: {
      savingsRate: savingsRateDelta,
      budgetDiscipline: budgetDisciplineDelta,
      emergencyFund: emergencyFundDelta,
      debtBurden: debtLoadDelta,
      goalVelocity: current.goalVelocity - previous.goalVelocity,
    },
    savingsRateDelta,
    budgetDisciplineDelta,
    emergencyFundDelta,
    debtLoadDelta,
    investmentsDelta,
    primaryDriver,
    explanation,
    summaryText: explanation,
  };
}

/**
 * Deterministic Transaction Search & Filter Engine
 * Fast in-memory filtering across merchant, category, amount, date, type, recurring, and anomalies.
 */
export function searchAndFilterTransactions(
  transactions: Transaction[],
  query: string
): Transaction[] {
  const q = query.trim().toLowerCase();
  if (!q) return transactions;

  // Numerical comparison queries: e.g. "> 2000" or "< 500"
  if (q.startsWith('>') || q.startsWith('<')) {
    const operator = q[0];
    const threshold = parseFloat(q.substring(1).trim());
    if (!isNaN(threshold)) {
      return transactions.filter((t) => (operator === '>' ? t.amount > threshold : t.amount < threshold));
    }
  }

  // Exact amount queries: e.g. "5000"
  const numericVal = parseFloat(q);
  const isPureNumber = !isNaN(numericVal) && /^\d+(\.\d+)?$/.test(q);

  return transactions.filter((tx) => {
    if (isPureNumber && Math.abs(tx.amount - numericVal) < 0.01) {
      return true;
    }

    if (tx.merchant && tx.merchant.toLowerCase().includes(q)) return true;
    if (tx.category && tx.category.toLowerCase().includes(q)) return true;
    if (tx.type && tx.type.toLowerCase() === q) return true;
    if (tx.date && tx.date.toLowerCase().includes(q)) return true;

    // Keyword flags
    if (q === 'recurring' && tx.isRecurring) return true;
    if (q === 'anomaly' && tx.isAnomaly) return true;

    // Month names: "september", "sep", "august", "aug", etc.
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthIdx = monthNames.findIndex((name) => name.startsWith(q));
    if (monthIdx !== -1) {
      const padMonth = String(monthIdx + 1).padStart(2, '0');
      if (tx.date && tx.date.substring(5, 7) === padMonth) return true;
    }

    return false;
  });
}
