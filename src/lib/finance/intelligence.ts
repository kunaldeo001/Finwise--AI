import {
  Transaction,
  TransactionCategory,
  SubscriptionItem,
  ProactiveInsight,
  Budget,
} from '@/lib/types/finance';

// Merchant pattern dictionary for accurate categorization & recognition
const MERCHANT_CATEGORY_MAP: Array<{
  keywords: string[];
  category: TransactionCategory;
  cleanName: string;
}> = [
  // Food & Dining
  { keywords: ['swiggy', 'zomato', 'blinkit', 'zepto', 'mcdonald', 'starbucks', 'domino', 'kfc', 'cafe', 'restaurant', 'subway', 'haldiram', 'chai'], category: 'Food & Dining', cleanName: 'Dining & Delivery' },
  // Groceries / Supermarket
  { keywords: ['dmart', 'd-mart', 'bigbasket', 'nature basket', 'supermarket', 'grofers', 'more retail', 'reliance fresh', 'spencer'], category: 'Food & Dining', cleanName: 'Groceries' },
  // Transportation
  { keywords: ['uber', 'ola', 'rapido', 'metro', 'petrol', 'fuel', 'hpcl', 'bpcl', 'ioc', 'irctc', 'indigo', 'air india', 'fastag'], category: 'Transportation', cleanName: 'Transit & Fuel' },
  // Housing & Rent
  { keywords: ['rent', 'society maintenance', 'landlord', 'nobroker', 'magicbricks', 'housing'], category: 'Housing & Rent', cleanName: 'Rent & Housing' },
  // Utilities & Bills
  { keywords: ['bescom', 'mseb', 'electricity', 'power', 'tata power', 'water bill', 'airtel', 'jio', 'vi', 'vodafone', 'tata play', 'gas bill', 'adani electricity', 'broadband', 'act fibernet'], category: 'Utilities', cleanName: 'Utilities & Bills' },
  // Shopping
  { keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'zara', 'h&m', 'nykaa', 'tata cliq', 'croma', 'reliance digital', 'apple store'], category: 'Shopping', cleanName: 'E-Commerce / Shopping' },
  // Entertainment & Subscriptions
  { keywords: ['netflix', 'prime video', 'spotify', 'hotstar', 'disney', 'youtube premium', 'bookmyshow', 'pvr', 'inox', 'apple music', 'audible', 'chatgpt', 'openai', 'midjourney', 'github'], category: 'Subscriptions', cleanName: 'Media & Subscriptions' },
  // Healthcare
  { keywords: ['apollo', 'pharmeasy', '1mg', 'hospital', 'clinic', 'dentist', 'medplus', 'lab', 'diagnostics'], category: 'Healthcare', cleanName: 'Pharmacy & Healthcare' },
  // Investments
  { keywords: ['zerodha', 'groww', 'kuvera', 'coin', 'upstox', 'angelone', 'indmoney', 'sip', 'mutual fund', 'cams', 'kfintech'], category: 'Investments', cleanName: 'Investments & SIP' },
  // Income
  { keywords: ['salary', 'payroll', 'consulting', 'dividend', 'interest credit', 'freelance', 'stipend', 'bonus'], category: 'Salary', cleanName: 'Salary & Income' },
  // Debt & EMI
  { keywords: ['emi', 'hdfc loan', 'sbi loan', 'icici loan', 'credit card payment', 'bajaj finance', 'cred'], category: 'Debt & EMI', cleanName: 'Loan EMI & Card' },
];

const KNOWN_SUBSCRIPTION_KEYWORDS = [
  'netflix', 'spotify', 'prime', 'amazon prime', 'hotstar', 'disney', 'youtube',
  'apple music', 'icloud', 'google one', 'chatgpt', 'openai', 'github',
  'airtel', 'jio fiber', 'broadband', 'gym', 'cult.fit', 'adobe', 'canva', 'zoom'
];

/**
 * Automatically categorize a transaction based on merchant name or description
 */
export function autoCategorizeTransaction(merchantOrDesc: string): {
  category: TransactionCategory;
  cleanMerchant: string;
} {
  const query = merchantOrDesc.toLowerCase().trim();

  for (const item of MERCHANT_CATEGORY_MAP) {
    for (const keyword of item.keywords) {
      if (query.includes(keyword)) {
        return {
          category: item.category,
          cleanMerchant: item.cleanName,
        };
      }
    }
  }

  if (query.includes('pay') || query.includes('transfer') || query.includes('upi')) {
    return { category: 'Other', cleanMerchant: merchantOrDesc };
  }

  return { category: 'Shopping', cleanMerchant: merchantOrDesc };
}

/**
 * Dedicated Subscription Intelligence Engine (Phase 7):
 * Scans transactions for recurring subscription vendors, SaaS, gym, media, and telecom
 */
export function detectSubscriptions(transactions: Transaction[]): {
  subscriptions: SubscriptionItem[];
  totalMonthlyRecurring: number;
  totalAnnualRecurring: number;
  annualInsight: string;
} {
  const expenseTxs = transactions.filter((tx) => tx.type === 'expense');
  const vendorGroups: Record<string, Transaction[]> = {};

  expenseTxs.forEach((tx) => {
    const raw = tx.merchant.toLowerCase();
    // Check known subscription keyword or isRecurring flag or Subscriptions category
    const isSub =
      tx.isRecurring ||
      tx.category === 'Subscriptions' ||
      KNOWN_SUBSCRIPTION_KEYWORDS.some((k) => raw.includes(k));

    if (isSub) {
      const key = raw.replace(/[^a-z0-9]/g, '');
      if (!vendorGroups[key]) vendorGroups[key] = [];
      vendorGroups[key].push(tx);
    }
  });

  const subscriptions: SubscriptionItem[] = [];

  Object.entries(vendorGroups).forEach(([key, txList]) => {
    const latest = txList[0];
    const avgAmount = Math.round(
      txList.reduce((sum, t) => sum + t.amount, 0) / txList.length
    );

    // Approximate next billing date based on last transaction
    const lastDate = new Date(latest.date);
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + 1);

    subscriptions.push({
      id: `sub-${key}`,
      merchant: latest.merchant,
      category: latest.category || 'Subscriptions',
      monthlyAmount: avgAmount,
      annualAmount: avgAmount * 12,
      frequency: 'monthly',
      nextBillingDate: nextDate.toISOString().substring(0, 10),
      status: 'active',
      reminderEnabled: true,
      detectedFromTransactionsCount: txList.length,
    });
  });

  // Sort by monthly amount descending
  subscriptions.sort((a, b) => b.monthlyAmount - a.monthlyAmount);

  const totalMonthlyRecurring = subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0);
  const totalAnnualRecurring = totalMonthlyRecurring * 12;

  const annualInsight = `You are spending approximately ₹${totalAnnualRecurring.toLocaleString('en-IN')}/year on ${subscriptions.length} recurring subscriptions.`;

  return {
    subscriptions,
    totalMonthlyRecurring,
    totalAnnualRecurring,
    annualInsight,
  };
}

/**
 * Detect recurring transactions
 */
export function detectRecurringTransactions(transactions: Transaction[]) {
  const subData = detectSubscriptions(transactions);
  return subData.subscriptions.map((s) => ({
    merchant: s.merchant,
    category: s.category,
    estimatedAmount: s.monthlyAmount,
    frequency: 'monthly' as const,
    count: s.detectedFromTransactionsCount,
    occurrences: transactions.filter(
      (tx) => tx.merchant.toLowerCase().replace(/[^a-z0-9]/g, '') === s.merchant.toLowerCase().replace(/[^a-z0-9]/g, '')
    ),
  }));
}

/**
 * Detect unusual or anomalous spending transactions
 */
export function detectUnusualSpending(transactions: Transaction[]): Array<{
  transaction: Transaction;
  reason: string;
  categoryAverage: number;
  ratio: number;
}> {
  const expenseTxs = transactions.filter((tx) => tx.type === 'expense');
  const categoryStats: Record<string, { total: number; count: number }> = {};

  expenseTxs.forEach((tx) => {
    const cat = tx.category;
    if (!categoryStats[cat]) categoryStats[cat] = { total: 0, count: 0 };
    categoryStats[cat].total += tx.amount;
    categoryStats[cat].count += 1;
  });

  const anomalies: Array<{
    transaction: Transaction;
    reason: string;
    categoryAverage: number;
    ratio: number;
  }> = [];

  expenseTxs.forEach((tx) => {
    const stat = categoryStats[tx.category];
    if (stat && stat.count >= 2) {
      const avg = stat.total / stat.count;
      // An anomaly if amount is 2.2x the category average and above ₹1,800
      if (tx.amount >= avg * 2.2 && tx.amount >= 1800) {
        const ratio = parseFloat((tx.amount / avg).toFixed(1));
        anomalies.push({
          transaction: tx,
          reason: `₹${tx.amount.toLocaleString('en-IN')} is ${ratio}x higher than your average ${tx.category} expense (₹${Math.round(avg).toLocaleString('en-IN')})`,
          categoryAverage: Math.round(avg),
          ratio,
        });
      }
    }
  });

  return anomalies;
}

/**
 * Compare spending month-over-month and generate actionable financial insights
 */
export function generateSpendingIntelligence(
  transactions: Transaction[],
  currentMonthStr?: string,
  previousMonthStr?: string
) {
  const now = new Date();
  const currentMonth = currentMonthStr || now.toISOString().substring(0, 7);

  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonth = previousMonthStr || prevDate.toISOString().substring(0, 7);

  const currentExpenses = transactions.filter(
    (tx) => tx.type === 'expense' && tx.date.startsWith(currentMonth)
  );
  const previousExpenses = transactions.filter(
    (tx) => tx.type === 'expense' && tx.date.startsWith(previousMonth)
  );

  const currentTotal = currentExpenses.reduce((sum, tx) => sum + tx.amount, 0);
  const previousTotal = previousExpenses.reduce((sum, tx) => sum + tx.amount, 0);
  const differenceAmount = currentTotal - previousTotal;
  const percentageChange =
    previousTotal > 0 ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100) : 0;

  const categories = Array.from(
    new Set([...currentExpenses.map((tx) => tx.category), ...previousExpenses.map((tx) => tx.category)])
  );

  const categoryComparisons = categories.map((category) => {
    const curCatTxs = currentExpenses.filter((tx) => tx.category === category);
    const prevCatTxs = previousExpenses.filter((tx) => tx.category === category);

    const curAmt = curCatTxs.reduce((s, tx) => s + tx.amount, 0);
    const prevAmt = prevCatTxs.reduce((s, tx) => s + tx.amount, 0);
    const pct = prevAmt > 0 ? Math.round(((curAmt - prevAmt) / prevAmt) * 100) : curAmt > 0 ? 100 : 0;

    let insight = '';
    if (pct > 20 && curAmt > 1000) {
      const extraTxCount = Math.max(0, curCatTxs.length - prevCatTxs.length);
      insight = `You spent ₹${curAmt.toLocaleString('en-IN')} on ${category}, which is ${pct}% higher than last month${extraTxCount > 0 ? ` (with ${extraTxCount} additional transactions)` : ''}.`;
    } else if (pct < -15 && prevAmt > 1000) {
      insight = `Great job! You reduced ${category} spending by ${Math.abs(pct)}% compared to last month.`;
    } else {
      insight = `${category} spending remained consistent with last month (₹${curAmt.toLocaleString('en-IN')}).`;
    }

    return {
      category,
      currentAmount: curAmt,
      previousAmount: prevAmt,
      percentageChange: pct,
      insight,
    };
  });

  const summaryInsights: string[] = [];
  if (percentageChange > 10) {
    summaryInsights.push(`Overall monthly spending increased by ${percentageChange}% (₹${Math.abs(differenceAmount).toLocaleString('en-IN')}).`);
  } else if (percentageChange < -10) {
    summaryInsights.push(`Overall monthly spending decreased by ${Math.abs(percentageChange)}% (saved ₹${Math.abs(differenceAmount).toLocaleString('en-IN')}).`);
  } else {
    summaryInsights.push(`Your spending is stable, tracking within normal monthly variance.`);
  }

  const sortedIncreases = [...categoryComparisons].sort((a, b) => b.currentAmount - a.currentAmount);
  if (sortedIncreases.length > 0 && sortedIncreases[0].currentAmount > 0) {
    summaryInsights.push(`Top spending category is ${sortedIncreases[0].category} at ₹${sortedIncreases[0].currentAmount.toLocaleString('en-IN')}.`);
  }

  return {
    currentTotal,
    previousTotal,
    differenceAmount,
    percentageChange,
    categoryComparisons,
    summaryInsights,
  };
}

/**
 * AI Financial Insight Engine (Phase 4):
 * Generates proactive, structured insights with supporting data, reasons, and suggested actions
 */
export function generateProactiveInsights(params: {
  transactions: Transaction[];
  budgets: Budget[];
  monthlyIncome: number;
  monthlyExpense: number;
  liquidSavings: number;
}): ProactiveInsight[] {
  const { transactions, budgets, monthlyIncome, monthlyExpense, liquidSavings } = params;
  const insights: ProactiveInsight[] = [];

  // 1. Food / Top Category shift insight
  const mom = generateSpendingIntelligence(transactions);
  const foodComparison = mom.categoryComparisons.find((c) => c.category === 'Food & Dining');
  if (foodComparison && Math.abs(foodComparison.percentageChange) > 10) {
    insights.push({
      id: 'insight-food-shift',
      title: 'Food & Dining Spending Shift',
      insight: `Your Food & Dining spending ${foodComparison.percentageChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(foodComparison.percentageChange)}% this month.`,
      supportingData: `Current: ₹${foodComparison.currentAmount.toLocaleString('en-IN')} vs Previous: ₹${foodComparison.previousAmount.toLocaleString('en-IN')}`,
      reason: foodComparison.percentageChange > 0
        ? 'Higher frequency of restaurant dining and quick delivery orders.'
        : 'Reduced dine-out frequency and disciplined meal planning.',
      suggestedAction: foodComparison.percentageChange > 0
        ? 'Cap weekly takeout orders to 2 times to preserve surplus.'
        : 'Great work maintaining grocery discipline; redirect the savings to your Emergency Fund.',
      severity: foodComparison.percentageChange > 25 ? 'warning' : 'positive',
      category: 'spending',
    });
  }

  // 2. Subscription Annual Load insight
  const subData = detectSubscriptions(transactions);
  if (subData.subscriptions.length > 0) {
    insights.push({
      id: 'insight-subscriptions',
      title: 'Recurring Subscription Burden',
      insight: `You have ${subData.subscriptions.length} recurring subscriptions totaling ₹${subData.totalMonthlyRecurring.toLocaleString('en-IN')}/month.`,
      supportingData: subData.annualInsight,
      reason: 'Multiple active digital entertainment, utilities, and SaaS auto-debit mandates.',
      suggestedAction: 'Audit subscriptions in the Subscription Manager and cancel unused streaming or software tools.',
      severity: subData.totalMonthlyRecurring > 2500 ? 'warning' : 'info',
      category: 'subscriptions',
    });
  }

  // 3. Savings Rate trajectory insight
  const netSavings = Math.max(0, monthlyIncome - monthlyExpense);
  const currentSavingsRate = monthlyIncome > 0 ? (netSavings / monthlyIncome) * 100 : 0;
  insights.push({
    id: 'insight-savings-rate',
    title: 'Monthly Savings Rate Health',
    insight: `Your monthly savings rate is currently tracking at ${currentSavingsRate.toFixed(1)}%.`,
    supportingData: `Net Surplus: ₹${netSavings.toLocaleString('en-IN')} from Gross Income of ₹${monthlyIncome.toLocaleString('en-IN')}`,
    reason: currentSavingsRate >= 20
      ? 'Living expenses are kept well below 80% of total cash inflow.'
      : 'Fixed and discretionary outflows represent over 80% of monthly earnings.',
    suggestedAction: currentSavingsRate >= 20
      ? 'Deploy surplus into SIP investments or goal roadmaps to compound wealth.'
      : 'Identify discretionary spending categories to increase your savings rate above the 20% benchmark.',
    severity: currentSavingsRate >= 20 ? 'positive' : 'warning',
    category: 'savings',
  });

  // 4. Emergency Fund Runway insight
  const monthlyBurn = Math.max(1000, monthlyExpense);
  const runwayMonths = parseFloat((liquidSavings / monthlyBurn).toFixed(1));
  insights.push({
    id: 'insight-emergency-runway',
    title: 'Emergency Cushion Liquidity',
    insight: `Your emergency reserve covers approximately ${runwayMonths} months of necessary living expenses.`,
    supportingData: `Liquid Balance: ₹${liquidSavings.toLocaleString('en-IN')} | Monthly Burn: ₹${monthlyBurn.toLocaleString('en-IN')}`,
    reason: runwayMonths >= 6
      ? 'Ample cash reserve protects against unforeseen income disruptions.'
      : 'Cash buffer is below the recommended 6-month resilience threshold.',
    suggestedAction: runwayMonths >= 6
      ? 'Fortress emergency reserve achieved. Direct further savings to long-term equity or index funds.'
      : `Allocate ₹${Math.round((monthlyBurn * 6 - liquidSavings) / 6).toLocaleString('en-IN')}/month to reach a 6-month buffer.`,
    severity: runwayMonths >= 3 ? 'positive' : 'critical',
    category: 'savings',
  });

  // 5. Budget Velocity Warnings
  budgets.forEach((b) => {
    const spent = transactions
      .filter((t) => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase())
      .reduce((s, t) => s + t.amount, 0);

    const pct = (spent / Math.max(1, b.limit)) * 100;
    if (pct >= 80) {
      insights.push({
        id: `insight-budget-${b.id}`,
        title: `${b.category} Budget Alert`,
        insight: `You have consumed ${pct.toFixed(0)}% of your ₹${b.limit.toLocaleString('en-IN')} ${b.category} budget.`,
        supportingData: `Spent: ₹${spent.toLocaleString('en-IN')} | Remaining: ₹${Math.max(0, b.limit - spent).toLocaleString('en-IN')}`,
        reason: 'Accelerated spending in this category earlier in the billing cycle.',
        suggestedAction: `Restrict discretionary purchases in ${b.category} until the new calendar month begins.`,
        severity: pct >= 100 ? 'critical' : 'warning',
        category: 'budget',
      });
    }
  });

  return insights;
}

/**
 * Confidence indicator calculation for receipt & invoice extraction (Phase 8)
 */
export function calculateReceiptConfidence(extracted: {
  vendor?: string;
  totalAmount?: number;
  date?: string;
  category?: string;
  items?: any[];
}): { score: number; level: 'High' | 'Medium' | 'Low' } {
  let score = 50;
  if (extracted.vendor && extracted.vendor.length > 2) score += 15;
  if (extracted.totalAmount && extracted.totalAmount > 0) score += 15;
  if (extracted.date && /^\d{4}-\d{2}-\d{2}$/.test(extracted.date)) score += 10;
  if (extracted.category) score += 5;
  if (extracted.items && extracted.items.length > 0) score += 5;

  const level = score >= 85 ? 'High' : score >= 65 ? 'Medium' : 'Low';
  return { score, level };
}
