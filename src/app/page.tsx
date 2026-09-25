'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { OverviewCards } from '@/components/dashboard/overview-cards';
import { FinancialHealthScoreCard } from '@/components/dashboard/financial-health-score-card';
import { CashFlowForecastCard } from '@/components/dashboard/cash-flow-forecast-card';
import { NetWorthCard } from '@/components/dashboard/net-worth-card';
import { Portfolio } from '@/components/dashboard/portfolio';
import { SmartAlertsCard } from '@/components/dashboard/smart-alerts-card';
import { MarketTrends } from '@/components/dashboard/market-trends';
import { ProactiveInsightsCard } from '@/components/dashboard/proactive-insights-card';
import { BudgetAndGoalsSummaryCard } from '@/components/dashboard/budget-and-goals-card';
import { FinancialTimeline } from '@/components/dashboard/financial-timeline';
import { DataQualityAndMonthlyCloseCard } from '@/components/dashboard/data-quality-card';
import { RunwayAndAffordabilityCard } from '@/components/dashboard/runway-and-affordability-card';
import { SmartOnboardingDialog } from '@/components/onboarding/smart-onboarding-dialog';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, PlusCircle, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { totals, healthScore, alerts, isDemo } = useFinwiseData();
  const [dateRange, setDateRange] = useState('current-month');

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      {/* Top Banner if demo mode */}
      {isDemo && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="size-4 text-accent shrink-0" />
            <p className="text-foreground">
              <span className="font-semibold text-accent">Demo Mode Active:</span> Showing realistic sample fintech data. All features, AI insights, cash flow forecasts, and calculations are fully functional.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" asChild className="h-7 text-xs border-accent/40 text-accent">
              <Link href="/transactions">Explore Transactions</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Header with Date Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Financial Overview</h1>
          <p className="text-xs text-muted-foreground">
            Comprehensive personal finance copilot, cash flow intelligence & wealth tracker.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 bg-card border border-border/80 rounded-lg px-2.5 py-1">
            <Calendar className="size-3.5 text-muted-foreground" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="h-7 border-0 bg-transparent text-xs focus:ring-0 w-[140px] px-1 font-medium">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month" className="text-xs">This Month (Sep)</SelectItem>
                <SelectItem value="last-30" className="text-xs">Last 30 Days</SelectItem>
                <SelectItem value="last-90" className="text-xs">Last 90 Days</SelectItem>
                <SelectItem value="ytd" className="text-xs">Year to Date (YTD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button size="sm" asChild className="gap-1.5 h-8 text-xs">
            <Link href="/transactions">
              <PlusCircle className="size-3.5" />
              Add Transaction
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild className="gap-1.5 h-8 text-xs border-accent/40 text-accent">
            <Link href="/assistant">
              <Sparkles className="size-3.5" />
              Ask Copilot
            </Link>
          </Button>
        </div>
      </div>

      {/* High-level KPIs (1 to 6 & 8) */}
      <OverviewCards />

      {/* 4. AI Financial Insight Engine (Proactive Surveillance) */}
      <ProactiveInsightsCard />

      {/* 7. Financial Health Score 2.0 (5 Pillars + Historical Trend) */}
      <FinancialHealthScoreCard score={healthScore} />

      {/* 10. Budget Velocity & 11. Goal Progress */}
      <BudgetAndGoalsSummaryCard />

      {/* Cash Flow Forecast & Net Worth Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowForecastCard
          currentBalance={totals.totalBalance}
          monthlyIncome={totals.currentMonthIncome}
          monthlyExpense={totals.currentMonthExpenses}
        />
        <NetWorthCard
          totalAssets={totals.totalAssets}
          totalLiabilities={totals.totalLiabilities}
          netWorth={totals.netWorth}
          assetDistribution={totals.assetDistribution}
          liabilityDistribution={totals.liabilityDistribution}
        />
      </div>

      {/* Deterministic Cash Runway, Emergency Fund, Affordability & Stress Scenarios */}
      <RunwayAndAffordabilityCard />

      {/* Deterministic Financial Data Quality & Monthly Close Review Engine */}
      <DataQualityAndMonthlyCloseCard />

      {/* 8. Portfolio Holdings & 12. Smart Alerts & Market Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Portfolio />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <SmartAlertsCard alerts={alerts} />
          <MarketTrends />
        </div>
      </div>

      {/* 11. Personal Finance Timeline (Chronological narrative) */}
      <FinancialTimeline />

      {/* 13. Smart First-Time Visitor Onboarding Modal */}
      <SmartOnboardingDialog />
    </div>
  );
}
