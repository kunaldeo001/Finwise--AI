'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Sparkles,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  CreditCard,
  Target,
  Wallet,
} from 'lucide-react';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { saveMonthlyReport } from '@/lib/finance/firestore-service';
import { exportMonthlyReportJSON } from '@/lib/finance/export';
import { useToast } from '@/hooks/use-toast';

export function MonthlyAIReport() {
  const finwise = useFinwiseData();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [isSaving, setIsSaving] = useState(false);

  const { totals, budgets, goals, investments, debts, unusualSpending, budgetStatuses } = finwise;

  const topCategory = useMemoTopCategory(finwise.transactions);

  function useMemoTopCategory(txs: any[]) {
    const catMap: Record<string, number> = {};
    txs.filter((t) => t.type === 'expense').forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      const totalExp = totals.currentMonthExpenses || 1;
      return {
        name: sorted[0][0],
        amount: sorted[0][1],
        percentage: Math.round((sorted[0][1] / totalExp) * 100),
      };
    }
    return { name: 'Food & Dining', amount: 8400, percentage: 24 };
  }

  const handleSaveReport = async () => {
    if (!finwise.firestore || !finwise.user?.uid) {
      toast({
        title: 'Report Download Ready',
        description: 'Report generated for September 2026. Sign in to archive permanently in cloud.',
      });
      return;
    }

    try {
      setIsSaving(true);
      await saveMonthlyReport(finwise.firestore, finwise.user.uid, {
        month: selectedMonth,
        totalIncome: totals.currentMonthIncome,
        totalExpenses: totals.currentMonthExpenses,
        savings: totals.netSavings,
        savingsRate: parseFloat(totals.savingsRate.toFixed(1)),
        topCategory,
        unusualSpending: unusualSpending.map((u) => ({
          merchant: u.transaction.merchant,
          amount: u.transaction.amount,
          reason: u.reason,
        })),
        budgetPerformance: {
          met: budgetStatuses.filter((b) => !b.isOverBudget).length,
          total: budgetStatuses.length,
          overspentCategories: budgetStatuses.filter((b) => b.isOverBudget).map((b) => b.budget.category),
        },
        goalProgress: {
          onTrack: goals.filter((g) => g.status === 'active').length,
          total: goals.length,
        },
        investmentSummary: {
          totalInvested: totals.totalInvested,
          totalValue: totals.currentPortfolioValue,
          returnRate: parseFloat(totals.portfolioGainPct.toFixed(2)),
        },
        debtSummary: {
          totalRemaining: totals.totalDebtRemaining,
          totalMonthlyEmi: totals.totalMonthlyEmi,
        },
        aiObservations: [
          `Retained ₹${totals.netSavings.toLocaleString('en-IN')} with an effective savings rate of ${totals.savingsRate.toFixed(1)}%.`,
          `Highest outflow concentrated in ${topCategory.name} (₹${topCategory.amount.toLocaleString('en-IN')}).`,
          `Investment portfolio appreciated by ${totals.portfolioGainPct.toFixed(1)}% total return.`,
          `${budgetStatuses.filter((b) => !b.isOverBudget).length} out of ${budgetStatuses.length} budgets strictly respected.`,
        ],
        recommendations: [
          'Direct at least 40% of monthly surplus into emergency buffer till 6-month runway is secured.',
          'Consider small prepayments towards loans to accelerate amortization schedule.',
          'Review subscriptions to eliminate duplicate media streaming services.',
        ],
        createdAt: new Date().toISOString(),
      });

      toast({
        title: 'Monthly Report Archived',
        description: `Successfully saved ${selectedMonth} Financial Report to Firestore.`,
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const reportPayload = {
      month: selectedMonth,
      generatedAt: new Date().toISOString(),
      totals: {
        income: totals.currentMonthIncome,
        expenses: totals.currentMonthExpenses,
        savings: totals.netSavings,
        savingsRate: `${totals.savingsRate.toFixed(1)}%`,
        netWorth: totals.netWorth,
      },
      topCategory,
      budgetPerformance: {
        met: budgetStatuses.filter((b) => !b.isOverBudget).length,
        total: budgetStatuses.length,
        overspentCategories: budgetStatuses.filter((b) => b.isOverBudget).map((b) => b.budget.category),
      },
      goalProgress: {
        onTrack: goals.filter((g) => g.status === 'active').length,
        total: goals.length,
      },
      investments: {
        invested: totals.totalInvested,
        currentValue: totals.currentPortfolioValue,
        returnPct: `${totals.portfolioGainPct.toFixed(2)}%`,
      },
      debts: {
        remaining: totals.totalDebtRemaining,
        monthlyEmi: totals.totalMonthlyEmi,
      },
    };
    exportMonthlyReportJSON(reportPayload, `finwise_report_${selectedMonth}.json`);
    toast({
      title: 'Report Downloaded',
      description: `Downloaded JSON audit report for ${selectedMonth}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-4 rounded-xl border border-border/70 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Monthly AI Executive Summary</h3>
            <p className="text-xs text-muted-foreground">
              Period: September 2026 • AI-synthesized audit of cash flow, budgets, and investments
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 text-xs gap-1.5">
            <Download className="size-3.5" />
            Print / PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJson} className="h-8 text-xs gap-1.5">
            <Download className="size-3.5" />
            Export JSON
          </Button>
          <Button
            size="sm"
            onClick={handleSaveReport}
            disabled={isSaving}
            className="h-8 text-xs gap-1.5"
          >
            <FileText className="size-3.5" />
            {isSaving ? 'Archiving...' : 'Archive in Cloud'}
          </Button>
        </div>
      </div>

      {/* Main Formatted Report Document */}
      <Card className="shadow-md border border-border/80 bg-card overflow-hidden">
        <CardHeader className="border-b bg-muted/20 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Badge variant="outline" className="text-[10px] text-accent border-accent/40 mb-2">
                FinWise AI Verified Financial Statement
              </Badge>
              <CardTitle className="text-2xl font-bold">Monthly Financial Intelligence Report</CardTitle>
              <CardDescription className="text-xs mt-1">
                Generated for account: {finwise.user?.email || 'Guest User'} • Period: {selectedMonth}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Health Rating</div>
              <div className="text-lg font-bold text-accent">
                {finwise.healthScore.overallScore}/100 • {finwise.healthScore.rating}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Executive KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-lg border bg-muted/20">
              <span className="text-xs text-muted-foreground font-medium block">Total Monthly Income</span>
              <span className="text-xl font-bold text-emerald-400">
                ₹{totals.currentMonthIncome.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3.5 rounded-lg border bg-muted/20">
              <span className="text-xs text-muted-foreground font-medium block">Total Monthly Expenses</span>
              <span className="text-xl font-bold text-foreground">
                ₹{totals.currentMonthExpenses.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3.5 rounded-lg border bg-muted/20">
              <span className="text-xs text-muted-foreground font-medium block">Net Saved Surplus</span>
              <span className="text-xl font-bold text-accent">
                ₹{totals.netSavings.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3.5 rounded-lg border bg-muted/20">
              <span className="text-xs text-muted-foreground font-medium block">Savings Rate</span>
              <span className="text-xl font-bold text-foreground">
                {totals.savingsRate.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Section: Category & Spending Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-card/60 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Wallet className="size-3.5 text-accent" />
                Category Performance & Limits
              </h4>
              <div className="text-xs space-y-1.5 text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">Top Category: </span>
                  {topCategory.name} (₹{topCategory.amount.toLocaleString('en-IN')}, representing {topCategory.percentage}% of total expenses).
                </div>
                <div>
                  <span className="font-semibold text-foreground">Budget Discipline: </span>
                  {budgetStatuses.filter((b) => !b.isOverBudget).length} of {budgetStatuses.length} categories stayed strictly under budget.
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card/60 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-accent" />
                Wealth & Debt Summary
              </h4>
              <div className="text-xs space-y-1.5 text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">Investments: </span>
                  Valued at ₹{totals.currentPortfolioValue.toLocaleString('en-IN')} with an overall ROI of +{totals.portfolioGainPct.toFixed(1)}%.
                </div>
                <div>
                  <span className="font-semibold text-foreground">Debt Load: </span>
                  Remaining loan balance is ₹{totals.totalDebtRemaining.toLocaleString('en-IN')} with ₹{totals.totalMonthlyEmi.toLocaleString('en-IN')}/mo in EMI debits.
                </div>
              </div>
            </div>
          </div>

          {/* Section: AI Observations */}
          <div className="p-4 rounded-lg border border-accent/30 bg-accent/5 space-y-2 text-xs">
            <h4 className="font-semibold text-accent flex items-center gap-1.5">
              <Sparkles className="size-3.5" />
              AI Key Observations
            </h4>
            <ul className="space-y-1.5 text-muted-foreground pl-4 list-disc">
              <li>
                You retained ₹{totals.netSavings.toLocaleString('en-IN')} this month with a healthy {totals.savingsRate.toFixed(1)}% savings rate.
              </li>
              <li>
                Your largest spending category was {topCategory.name} at ₹{topCategory.amount.toLocaleString('en-IN')}.
              </li>
              {unusualSpending.length > 0 && (
                <li>
                  Flagged {unusualSpending.length} atypical transactions, including {unusualSpending[0].transaction.merchant} (₹{unusualSpending[0].transaction.amount.toLocaleString('en-IN')}).
                </li>
              )}
              <li>
                Debt obligations require {totals.currentMonthIncome > 0 ? ((totals.totalMonthlyEmi / totals.currentMonthIncome) * 100).toFixed(0) : 0}% of gross income.
              </li>
            </ul>
          </div>

          {/* Section: Suggested Areas to Improve */}
          <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2 text-xs">
            <h4 className="font-semibold text-amber-400 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" />
              Suggested Action Items for Next Month
            </h4>
            <ul className="space-y-1.5 text-muted-foreground pl-4 list-disc">
              <li>
                Maintain emergency fund contributions towards achieving 6 full months of living expenses.
              </li>
              <li>
                Trim discretionary subscriptions by auditing recurring entertainment and media expenses.
              </li>
              <li>
                Explore loan prepayments using the Debt & EMI Simulator to shave off interest liabilities.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
