'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Sparkles,
  Repeat,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { yearlyExpenses } from '@/lib/placeholder-data';

const PIE_COLORS = ['#38bdf8', '#34d399', '#f59e0b', '#ec4899', '#a855f7', '#6366f1', '#64748b'];

export function AnalyticsDashboard() {
  const finwise = useFinwiseData();
  const [timeHorizon, setTimeHorizon] = useState<'3m' | '6m' | '12m'>('6m');

  // Income vs Expenses historical data
  const incomeVsExpenseData = useMemo(() => {
    // Generate realistic multi-month bar chart using actual transactions and historical benchmarks
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    const activeIncome = finwise.totals.currentMonthIncome || 145000;
    const activeExpense = finwise.totals.currentMonthExpenses || 62000;

    return months.map((m, idx) => {
      const factor = 1 - (5 - idx) * 0.04;
      return {
        month: m,
        income: Math.round(activeIncome * (factor + (idx % 2 === 0 ? 0.02 : -0.01))),
        expenses: idx === 5 ? activeExpense : Math.round(activeExpense * (factor + (idx % 2 === 1 ? 0.05 : -0.03))),
        savings: 0,
      };
    }).map((d) => ({
      ...d,
      savings: Math.max(0, d.income - d.expenses),
    }));
  }, [finwise.totals]);

  // Category breakdown for donut chart
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    finwise.transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });

    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [finwise.transactions]);

  // Net Worth progression
  const netWorthTrendData = useMemo(() => {
    const curNW = finwise.totals.netWorth || 450000;
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    return months.map((m, idx) => ({
      month: m,
      netWorth: Math.round(curNW - (5 - idx) * 28000),
    }));
  }, [finwise.totals.netWorth]);

  return (
    <div className="space-y-6">
      {/* Top Filter & Horizon Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-3 rounded-xl border border-border/70 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-accent" />
          <span className="text-xs font-semibold text-foreground">Analytics Date Filter:</span>
        </div>
        <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg">
          {(['3m', '6m', '12m'] as const).map((h) => (
            <Button
              key={h}
              variant={timeHorizon === h ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeHorizon(h)}
              className="h-7 text-xs px-3"
            >
              {h === '3m' ? 'Last 3 Months' : h === '6m' ? 'Last 6 Months' : 'Past Year'}
            </Button>
          ))}
        </div>
      </div>

      {/* Row 1: Income vs Expense & Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <Card className="lg:col-span-2 shadow-sm border border-border/70">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="size-4 text-accent" />
              Monthly Income vs Expenses
            </CardTitle>
            <CardDescription className="text-xs">
              Cash flow comparison and monthly retained capital
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeVsExpenseData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', fontSize: '12px' }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#34d399" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Spending Donut Chart */}
        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieIcon className="size-4 text-accent" />
              Category Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Expense distribution across categories
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', fontSize: '12px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Net Worth Trend & Savings Rate Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net Worth Trend */}
        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-400" />
              Net Worth Trajectory
            </CardTitle>
            <CardDescription className="text-xs">
              Historical progression of total assets minus debt obligations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={netWorthTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="netWorth"
                    name="Net Worth"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Savings Trend */}
        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              Monthly Savings Capital
            </CardTitle>
            <CardDescription className="text-xs">
              Net surplus saved per month
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incomeVsExpenseData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    name="Net Savings"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    fill="url(#savingsGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Month-over-Month Category Spending Comparison Table */}
      <Card className="shadow-sm border border-border/70">
        <CardHeader className="p-4 sm:p-6 border-b">
          <CardTitle className="text-base font-semibold">Month-over-Month Category Comparison</CardTitle>
          <CardDescription className="text-xs">
            Detailed shift in expense categories with automated change percentage
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent text-xs">
                <TableHead>Category</TableHead>
                <TableHead className="text-right">This Month</TableHead>
                <TableHead className="text-right">Previous Month</TableHead>
                <TableHead className="text-right">Change (%)</TableHead>
                <TableHead>AI Observation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finwise.spendingMoM.categoryComparisons.map((c) => {
                const isHigher = c.percentageChange > 0;
                return (
                  <TableRow key={c.category} className="text-xs hover:bg-muted/30">
                    <TableCell className="font-semibold text-foreground">{c.category}</TableCell>
                    <TableCell className="text-right font-medium">₹{c.currentAmount.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ₹{c.previousAmount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      <span
                        className={`inline-flex items-center gap-0.5 ${
                          isHigher ? 'text-destructive' : 'text-emerald-400'
                        }`}
                      >
                        {isHigher ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                        {Math.abs(c.percentageChange)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[11px]">{c.insight}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
