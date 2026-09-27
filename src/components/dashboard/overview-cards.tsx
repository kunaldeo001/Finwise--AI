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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
      {/* 1. Total Balance */}
      <Card className="relative overflow-hidden shadow-xs border border-border/70 hover:border-emerald-500/40 hover:shadow-md transition-all duration-200 group before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-emerald-500">
        <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total Balance
          </span>
          <div className="size-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
            <PiggyBank className="size-3.5" />
          </div>
        </CardHeader>
        <CardContent className="p-3.5 pt-1">
          <div className="text-xl font-bold tracking-tight text-foreground font-sans tabular-nums">
            ₹{totalBalance.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Available liquid cash</span>
        </CardContent>
      </Card>

      {/* 2. Monthly Income */}
      <Card className="relative overflow-hidden shadow-xs border border-border/70 hover:border-emerald-500/40 hover:shadow-md transition-all duration-200 group before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-emerald-500">
        <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Monthly Inflow
          </span>
          <div className="size-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
            <ArrowUpRight className="size-3.5" />
          </div>
        </CardHeader>
        <CardContent className="p-3.5 pt-1">
          <div className="text-xl font-bold tracking-tight text-emerald-400 font-sans tabular-nums">
            +₹{currentMonthIncome.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Salary & freelancing</span>
        </CardContent>
      </Card>

      {/* 3. Monthly Expenses */}
      <Card className="relative overflow-hidden shadow-xs border border-border/70 hover:border-rose-500/40 hover:shadow-md transition-all duration-200 group before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-rose-500">
        <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Monthly Outflow
          </span>
          <div className="size-6 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:bg-rose-500/20 transition-colors">
            <Wallet className="size-3.5" />
          </div>
        </CardHeader>
        <CardContent className="p-3.5 pt-1">
          <div className="text-xl font-bold tracking-tight text-rose-400 font-sans tabular-nums">
            -₹{currentMonthExpenses.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Living & discretionary</span>
        </CardContent>
      </Card>

      {/* 4. Net Savings & Savings Rate */}
      <Card className="relative overflow-hidden shadow-xs border border-border/70 hover:border-teal-500/40 hover:shadow-md transition-all duration-200 group before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-teal-500">
        <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Net Savings
          </span>
          <div className="size-6 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/20 transition-colors">
            <Sparkles className="size-3.5" />
          </div>
        </CardHeader>
        <CardContent className="p-3.5 pt-1">
          <div className="text-xl font-bold tracking-tight text-teal-400 font-sans tabular-nums">
            ₹{netSavings.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] font-semibold text-emerald-400">
            {savingsRate.toFixed(1)}% savings rate
          </span>
        </CardContent>
      </Card>

      {/* 5. Net Worth */}
      <Card className="relative overflow-hidden shadow-xs border border-border/70 hover:border-blue-500/40 hover:shadow-md transition-all duration-200 group before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-blue-500">
        <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Net Worth
          </span>
          <div className="size-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
            <Landmark className="size-3.5" />
          </div>
        </CardHeader>
        <CardContent className="p-3.5 pt-1">
          <div className="text-xl font-bold tracking-tight text-foreground font-sans tabular-nums">
            ₹{netWorth.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
            <ArrowUpRight className="size-2.5" /> +{netWorthChangePct}% this month
          </span>
        </CardContent>
      </Card>

      {/* 6. Portfolio Value */}
      <Card className="relative overflow-hidden shadow-xs border border-border/70 hover:border-violet-500/40 hover:shadow-md transition-all duration-200 group before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-violet-500">
        <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Portfolio Value
          </span>
          <div className="size-6 rounded-md bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-500/20 transition-colors">
            <TrendingUp className="size-3.5" />
          </div>
        </CardHeader>
        <CardContent className="p-3.5 pt-1">
          <div className="text-xl font-bold tracking-tight text-foreground font-sans tabular-nums">
            ₹{currentPortfolioValue.toLocaleString('en-IN')}
          </div>
          <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${portfolioGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            <ArrowUpRight className="size-2.5" /> {portfolioGain >= 0 ? '+' : ''}{portfolioGainPct.toFixed(1)}% all-time
          </span>
        </CardContent>
      </Card>

      {/* 7. Upcoming Bills */}
      <Card className="relative overflow-hidden shadow-xs border border-border/70 hover:border-amber-500/40 hover:shadow-md transition-all duration-200 group before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-amber-500">
        <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Upcoming Bills
          </span>
          <div className="size-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 transition-colors">
            <Calendar className="size-3.5" />
          </div>
        </CardHeader>
        <CardContent className="p-3.5 pt-1">
          <div className="text-xl font-bold tracking-tight text-foreground font-sans tabular-nums">
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
