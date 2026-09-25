'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Hourglass,
  Calculator,
  ShieldAlert,
  Flame,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import {
  calculateCashRunway,
  calculateEmergencyFundPlan,
  evaluateAffordability,
  simulateFinancialStressTest,
  StressScenario,
} from '@/lib/finance/calculations';

export function RunwayAndAffordabilityCard() {
  const finwise = useFinwiseData();

  // Emergency Fund target months state (3, 6, 9, 12)
  const [targetMonths, setTargetMonths] = useState<3 | 6 | 9 | 12>(6);

  // Affordability Calculator inputs
  const [purchaseAmount, setPurchaseAmount] = useState('45000');

  // Stress test scenario selector
  const [stressScenario, setStressScenario] = useState<StressScenario>('INCOME_DROP_20');

  // 1. Cash Runway computation
  const essentialMonthlyExpenses = Math.round(finwise.totals.currentMonthExpenses * 0.7); // 70% essential benchmark
  const runway = calculateCashRunway({
    liquidCash: finwise.totals.totalBalance,
    essentialMonthlyExpenses,
    totalMonthlyExpenses: finwise.totals.currentMonthExpenses,
  });

  // 2. Emergency Fund Planner computation
  const emergencyPlan = calculateEmergencyFundPlan({
    essentialMonthlyExpenses,
    currentFund: finwise.totals.totalBalance,
    targetMonths,
    monthlyContribution: Math.round(finwise.totals.netSavings * 0.5),
  });

  // 3. Affordability evaluation
  const affordability = evaluateAffordability({
    purchasePrice: parseFloat(purchaseAmount) || 0,
    currentLiquidCash: finwise.totals.totalBalance,
    monthlyIncome: finwise.totals.currentMonthIncome,
    monthlyExpenses: finwise.totals.currentMonthExpenses,
    emergencyFundTarget: emergencyPlan.targetAmount,
    existingMonthlyDebt: finwise.totals.totalMonthlyEmi,
  });

  // 4. Financial Stress Test computation
  const stressTest = simulateFinancialStressTest({
    monthlyIncome: finwise.totals.currentMonthIncome,
    monthlyExpenses: finwise.totals.currentMonthExpenses,
    liquidCash: finwise.totals.totalBalance,
    debtEmi: finwise.totals.totalMonthlyEmi,
    scenario: stressScenario,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Cash Runway & Emergency Fund Planner */}
      <Card className="shadow-sm border border-border/70">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Hourglass className="size-4 text-accent" />
              <CardTitle className="text-base font-semibold">Cash Runway & Emergency Reserve</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Deterministic survival runway based on liquid balance and essential burn rate.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
            CALCULATED
          </Badge>
        </CardHeader>

        <CardContent className="pt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Essential Runway</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {runway.essentialRunwayMonths} <span className="text-xs font-normal">months</span>
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">₹{essentialMonthlyExpenses.toLocaleString('en-IN')}/mo essential</span>
            </div>

            <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Total Burn Runway</span>
              <span className="text-lg font-bold text-foreground font-mono">
                {runway.totalSpendingRunwayMonths} <span className="text-xs font-normal">months</span>
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">All lifestyle expenses</span>
            </div>

            <div className="p-3 rounded-xl bg-muted/20 border border-border/50 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Target Buffer</span>
              <div className="flex items-center gap-1 mt-1">
                {([3, 6, 9, 12] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTargetMonths(m)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      targetMonths === m
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground block mt-1">
                Target: ₹{emergencyPlan.targetAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-xl p-3 space-y-1.5 text-[11px] text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Current Liquid Reserves:</span>
              <strong className="text-foreground">₹{emergencyPlan.currentFund.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Target Amount ({targetMonths} months):</span>
              <strong className="text-foreground">₹{emergencyPlan.targetAmount.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Reserve Gap / Shortfall:</span>
              <strong className={emergencyPlan.remainingAmount > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                {emergencyPlan.remainingAmount > 0
                  ? `₹${emergencyPlan.remainingAmount.toLocaleString('en-IN')} needed`
                  : 'Fully Capitalized ✓'}
              </strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Affordability & Mathematical Stress Testing */}
      <Card className="shadow-sm border border-border/70">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calculator className="size-4 text-accent" />
              <CardTitle className="text-base font-semibold">Affordability & Stress Scenarios</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Mathematical impact test without arbitrary AI opinions.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30 bg-amber-500/10 font-mono">
            SCENARIO — NOT A FORECAST
          </Badge>
        </CardHeader>

        <CardContent className="pt-4 space-y-4 text-xs">
          {/* Affordability Calculator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground text-xs">Test an Asset / Large Purchase:</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-[11px]">Amount: ₹</span>
                <Input
                  type="number"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  className="h-7 w-28 text-xs font-mono"
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 font-semibold">
                {affordability.isAffordable ? (
                  <CheckCircle className="size-3.5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="size-3.5 text-amber-400" />
                )}
                <span className={affordability.isAffordable ? 'text-emerald-400' : 'text-amber-400'}>
                  {affordability.verdict}
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed">{affordability.explanation}</p>
            </div>
          </div>

          {/* Stress Scenario Selector */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                <Flame className="size-3.5 text-destructive" /> Financial Shock Test:
              </span>
              <Select
                value={stressScenario}
                onValueChange={(v) => setStressScenario(v as StressScenario)}
              >
                <SelectTrigger className="h-7 text-xs w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME_DROP_10" className="text-xs">Income Drops 10%</SelectItem>
                  <SelectItem value="INCOME_DROP_20" className="text-xs">Income Drops 20%</SelectItem>
                  <SelectItem value="EXPENSE_SURGE_10" className="text-xs">Expenses Surge 10%</SelectItem>
                  <SelectItem value="EXPENSE_SURGE_20" className="text-xs">Expenses Surge 20%</SelectItem>
                  <SelectItem value="UNEXPECTED_EXPENSE_50K" className="text-xs">Emergency Shock ₹50,000</SelectItem>
                  <SelectItem value="UNEXPECTED_EXPENSE_100K" className="text-xs">Emergency Shock ₹1,00,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-2.5 rounded-lg bg-background/80 border border-border/50 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">Scenario Impact: </span>
              {stressTest.impactDescription}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
