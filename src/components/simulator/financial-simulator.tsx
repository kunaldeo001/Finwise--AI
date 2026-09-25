'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  CreditCard,
  Wallet,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { simulateFinancialScenario } from '@/lib/finance/calculations';

export function FinancialSimulator() {
  const finwise = useFinwiseData();

  // Baseline variables from real user data
  const baseIncome = finwise.totals.currentMonthIncome || 120000;
  const baseExpenses = finwise.totals.currentMonthExpenses || 65000;
  const baseLiquid = finwise.totals.totalBalance || 75000;
  const baseInvestments = finwise.totals.currentPortfolioValue || 450000;
  const baseDebts = finwise.totals.totalDebtRemaining || 2400000;
  const baseMonthlyEmi = finwise.totals.totalMonthlyEmi || 24749;

  // Simulator adjustable state
  const [incomeChange, setIncomeChange] = useState<number>(0); // -20k to +50k
  const [expenseReduction, setExpenseReduction] = useState<number>(0); // 0 to 30k
  const [extraSip, setExtraSip] = useState<number>(0); // 0 to 30k
  const [extraPrepayment, setExtraPrepayment] = useState<number>(0); // 0 to 25k
  const [bigPurchase, setBigPurchase] = useState<number>(0); // e.g. 0 to 300,000
  const [newLoanAmount, setNewLoanAmount] = useState<number>(0); // e.g. 0 to 1,000,000
  const [newLoanTenure, setNewLoanTenure] = useState<number>(36); // months

  const simulation = useMemo(() => {
    return simulateFinancialScenario({
      currentMonthlyIncome: baseIncome,
      currentMonthlyExpense: baseExpenses,
      currentLiquidSavings: baseLiquid,
      currentInvestments: baseInvestments,
      currentDebts: baseDebts,
      monthlyDebtEmi: baseMonthlyEmi,
      adjustments: {
        incomeChange,
        expenseReduction,
        extraSipContribution: extraSip,
        extraDebtPrepayment: extraPrepayment,
        bigPurchaseAmount: bigPurchase,
        newLoanPrincipal: newLoanAmount,
        newLoanTenureMonths: newLoanTenure,
        newLoanRatePercent: 9.2,
      },
    });
  }, [
    baseIncome,
    baseExpenses,
    baseLiquid,
    baseInvestments,
    baseDebts,
    baseMonthlyEmi,
    incomeChange,
    expenseReduction,
    extraSip,
    extraPrepayment,
    bigPurchase,
    newLoanAmount,
    newLoanTenure,
  ]);

  const handleReset = () => {
    setIncomeChange(0);
    setExpenseReduction(0);
    setExtraSip(0);
    setExtraPrepayment(0);
    setBigPurchase(0);
    setNewLoanAmount(0);
  };

  const isSimulated =
    incomeChange !== 0 ||
    expenseReduction !== 0 ||
    extraSip !== 0 ||
    extraPrepayment !== 0 ||
    bigPurchase !== 0 ||
    newLoanAmount !== 0;

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-4 rounded-xl border border-border/70 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
            <Calculator className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2">
              Interactive Financial Decision Engine
              {isSimulated && (
                <Badge variant="outline" className="text-[10px] text-accent border-accent/40 bg-accent/5">
                  Scenario Modified
                </Badge>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              Adjust levers to model lifestyle decisions, big purchases, loans, and wealth compounding over 5 years
            </p>
          </div>
        </div>

        {isSimulated && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 text-xs gap-1 text-muted-foreground">
            <RotateCcw className="size-3" />
            Reset Baseline
          </Button>
        )}
      </div>

      {/* Simulator Metrics Comparison */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] text-muted-foreground uppercase font-medium">Monthly Net Savings</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-accent">
              ₹{simulation.newNetSavings.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Baseline: ₹{(baseIncome - baseExpenses - baseMonthlyEmi).toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] text-muted-foreground uppercase font-medium">New Savings Rate</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-emerald-400">
              {simulation.newSavingsRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Baseline: {(((baseIncome - baseExpenses - baseMonthlyEmi) / baseIncome) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] text-muted-foreground uppercase font-medium">Post-Action Cash Reserve</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground">
              ₹{simulation.newLiquidSavings.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available liquid cushion
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] text-muted-foreground uppercase font-medium">5-Yr Net Worth Shift</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div
              className={`text-2xl font-bold flex items-center gap-1 ${
                simulation.netWorthDeltaAtYear5 >= 0 ? 'text-emerald-400' : 'text-destructive'
              }`}
            >
              {simulation.netWorthDeltaAtYear5 >= 0 ? <ArrowUpRight className="size-5" /> : <ArrowDownRight className="size-5" />}
              ₹{Math.abs(simulation.netWorthDeltaAtYear5).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cumulative net worth delta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Simulator Inputs & 5-Year Projection Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Panel */}
        <Card className="lg:col-span-5 shadow-sm border border-border/70">
          <CardHeader className="p-4 sm:p-5 border-b">
            <CardTitle className="text-sm font-semibold">Simulation Variable Sliders</CardTitle>
            <CardDescription className="text-xs">
              Drag each variable to test immediate and long-term financial consequences
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-5">
            {/* 1. Monthly Expense Reduction */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-1">
                  <Wallet className="size-3.5 text-accent" /> Reduce Monthly Expenses
                </span>
                <span className="font-bold text-emerald-400">
                  -₹{expenseReduction.toLocaleString('en-IN')}/mo
                </span>
              </div>
              <Slider
                value={[expenseReduction]}
                min={0}
                max={30000}
                step={1000}
                onValueChange={(val) => setExpenseReduction(val[0])}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>₹0 (Current)</span>
                <span>₹15,000</span>
                <span>₹30,000/mo saved</span>
              </div>
            </div>

            {/* 2. Monthly Income Adjustment */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-1">
                  <TrendingUp className="size-3.5 text-sky-400" /> Income Change (Raise / Side Gig)
                </span>
                <span className={`font-bold ${incomeChange >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>
                  {incomeChange >= 0 ? '+' : ''}₹{incomeChange.toLocaleString('en-IN')}/mo
                </span>
              </div>
              <Slider
                value={[incomeChange]}
                min={-20000}
                max={50000}
                step={2500}
                onValueChange={(val) => setIncomeChange(val[0])}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>-₹20k</span>
                <span>Current (₹0)</span>
                <span>+₹50k/mo</span>
              </div>
            </div>

            {/* 3. Increase SIP / Investment Contribution */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-1">
                  <Sparkles className="size-3.5 text-accent" /> Boost Monthly SIP
                </span>
                <span className="font-bold text-accent">
                  +₹{extraSip.toLocaleString('en-IN')}/mo
                </span>
              </div>
              <Slider
                value={[extraSip]}
                min={0}
                max={30000}
                step={1000}
                onValueChange={(val) => setExtraSip(val[0])}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>₹0</span>
                <span>₹15,000</span>
                <span>₹30,000/mo</span>
              </div>
            </div>

            {/* 4. Large Discretionary Purchase (Lump Sum) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-1">
                  <ShoppingBag className="size-3.5 text-amber-400" /> Big Purchase (Laptop, Trip, Gadget)
                </span>
                <span className="font-bold text-amber-400">
                  ₹{bigPurchase.toLocaleString('en-IN')} (One-Time)
                </span>
              </div>
              <Slider
                value={[bigPurchase]}
                min={0}
                max={300000}
                step={10000}
                onValueChange={(val) => setBigPurchase(val[0])}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>₹0</span>
                <span>₹1,50,000</span>
                <span>₹3,00,000</span>
              </div>
            </div>

            {/* 5. Take New Loan */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-1">
                  <CreditCard className="size-3.5 text-rose-400" /> Take New Loan / Credit Line
                </span>
                <span className="font-bold text-rose-400">
                  ₹{newLoanAmount.toLocaleString('en-IN')} {simulation.newLoanEmi > 0 ? `(₹${simulation.newLoanEmi}/mo EMI)` : ''}
                </span>
              </div>
              <Slider
                value={[newLoanAmount]}
                min={0}
                max={1000000}
                step={25000}
                onValueChange={(val) => setNewLoanAmount(val[0])}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>₹0</span>
                <span>₹5,00,000</span>
                <span>₹10,00,000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5-Year Net Worth Trajectory Chart */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-sm border border-border/70 h-full flex flex-col justify-between">
            <CardHeader className="p-4 sm:p-5 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="size-4 text-emerald-400" />
                    5-Year Projected Net Worth Curve
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Current trajectory vs. Simulated Decision Path (compounded at 12% annual equity CAGR)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={simulation.projectionPoints} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `₹${Math.round(v / 100000)}L`} />
                    <Tooltip
                      formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`}
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', fontSize: '12px' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="currentPath"
                      name="Current Trajectory"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                    <Line
                      type="monotone"
                      dataKey="simulatedPath"
                      name="Simulated Scenario"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Cash Flow Impact callout */}
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-xs text-foreground mt-4 flex items-center gap-2">
                <Sparkles className="size-4 text-accent shrink-0" />
                <span>{simulation.cashFlowImpactDescription}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
