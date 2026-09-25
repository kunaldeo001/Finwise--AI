'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  CreditCard,
  Sparkles,
  Landmark,
  Calendar,
  PiggyBank,
} from 'lucide-react';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { Skeleton } from '@/components/ui/skeleton';

export function OverviewCards() {
  const { totals, isLoading } = useFinwiseData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const {
    totalBalance,
    currentMonthIncome,
    currentMonthExpenses,
    netSavings,
    savingsRate,
    netWorth,
    netWorthChange,
    netWorthChangePct,
    currentPortfolioValue,
    portfolioGain,
    portfolioGainPct,
    upcomingBillsCount,
    upcomingBillsTotal,
  } = totals;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {/* 1. Total Balance */}
      <Card className="shadow-sm border border-border/70 hover:border-accent/50 transition-colors">
        <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total Balance
          </span>
          <div className="size-6 rounded-md bg-accent/15 flex items-center justify-center text-accent">
            <PiggyBank className="size-3" />
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <div className="text-xl font-bold text-foreground">
            ₹{totalBalance.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-muted-foreground">Available liquid cash</span>
        </CardContent>
      </Card>

      {/* 2. Monthly Income */}
      <Card className="shadow-sm border border-border/70 hover:border-accent/50 transition-colors">
        <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Monthly Inflow
          </span>
          <div className="size-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <ArrowUpRight className="size-3" />
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <div className="text-xl font-bold text-emerald-400">
            +₹{currentMonthIncome.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-muted-foreground">Salary & freelancing</span>
        </CardContent>
      </Card>

      {/* 3. Monthly Expenses */}
      <Card className="shadow-sm border border-border/70 hover:border-accent/50 transition-colors">
        <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Monthly Outflow
          </span>
          <div className="size-6 rounded-md bg-destructive/10 flex items-center justify-center text-destructive">
            <Wallet className="size-3" />
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <div className="text-xl font-bold text-foreground">
            ₹{currentMonthExpenses.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-muted-foreground">Living & discretionary</span>
        </CardContent>
      </Card>

      {/* 4. Net Savings & Savings Rate */}
      <Card className="shadow-sm border border-border/70 hover:border-accent/50 transition-colors">
        <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Net Savings
          </span>
          <div className="size-6 rounded-md bg-accent/15 flex items-center justify-center text-accent">
            <Sparkles className="size-3" />
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <div className="text-xl font-bold text-accent">
            ₹{netSavings.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] font-semibold text-emerald-400">
            {savingsRate.toFixed(1)}% savings rate
          </span>
        </CardContent>
      </Card>

      {/* 5. Net Worth */}
      <Card className="shadow-sm border border-border/70 hover:border-accent/50 transition-colors">
        <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Net Worth
          </span>
          <div className="size-6 rounded-md bg-sky-500/10 flex items-center justify-center text-sky-400">
            <Landmark className="size-3" />
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <div className="text-xl font-bold text-foreground">
            ₹{netWorth.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
            <ArrowUpRight className="size-2.5" /> +{netWorthChangePct}% this month
          </span>
        </CardContent>
      </Card>

      {/* 6. Portfolio Value */}
      <Card className="shadow-sm border border-border/70 hover:border-accent/50 transition-colors">
        <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Portfolio Value
          </span>
          <div className="size-6 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-400">
            <TrendingUp className="size-3" />
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <div className="text-xl font-bold text-foreground">
            ₹{currentPortfolioValue.toLocaleString('en-IN')}
          </div>
          <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${portfolioGain >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>
            <ArrowUpRight className="size-2.5" /> {portfolioGain >= 0 ? '+' : ''}{portfolioGainPct.toFixed(1)}% all-time
          </span>
        </CardContent>
      </Card>

      {/* 7. Upcoming Bills */}
      <Card className="shadow-sm border border-border/70 hover:border-accent/50 transition-colors">
        <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Upcoming Bills
          </span>
          <div className="size-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Calendar className="size-3" />
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <div className="text-xl font-bold text-foreground">
            ₹{upcomingBillsTotal.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">
            {upcomingBillsCount} auto-debits scheduled
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
