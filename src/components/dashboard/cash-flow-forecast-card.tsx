'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { generateCashFlowForecast } from '@/lib/finance/calculations';

interface CashFlowForecastCardProps {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export function CashFlowForecastCard({
  currentBalance,
  monthlyIncome,
  monthlyExpense,
}: CashFlowForecastCardProps) {
  const [selectedHorizon, setSelectedHorizon] = useState<30 | 60 | 90>(30);

  const forecast = useMemo(() => {
    return generateCashFlowForecast({
      currentBalance: Math.max(10000, currentBalance),
      monthlyIncome,
      monthlyExpense,
      days: selectedHorizon,
    });
  }, [currentBalance, monthlyIncome, monthlyExpense, selectedHorizon]);

  return (
    <Card className="overflow-hidden border border-border/70 shadow-sm">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <TrendingUp className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                Cash Flow Forecasting
                <Badge variant="outline" className="text-[10px] text-accent border-accent/30">
                  {forecast.confidence} Confidence
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Predictive balance runway based on recurring cash velocity
              </CardDescription>
            </div>
          </div>

          {/* 30 / 60 / 90 day buttons */}
          <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg">
            {([30, 60, 90] as const).map((days) => (
              <Button
                key={days}
                variant={selectedHorizon === days ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedHorizon(days)}
                className="h-7 text-xs px-3"
              >
                {days} Days
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* KPI metrics bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border bg-card/60">
            <span className="text-[11px] text-muted-foreground font-medium block">
              Projected Balance ({selectedHorizon}d)
            </span>
            <span className="text-lg font-bold text-foreground">
              ₹{forecast.projectedBalance.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 rounded-lg border bg-card/60">
            <span className="text-[11px] text-muted-foreground font-medium block">Expected Income</span>
            <span className="text-lg font-bold text-emerald-400">
              +₹{forecast.expectedIncome.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 rounded-lg border bg-card/60">
            <span className="text-[11px] text-muted-foreground font-medium block">Expected Expenses</span>
            <span className="text-lg font-bold text-destructive">
              -₹{forecast.expectedExpenses.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 rounded-lg border bg-card/60">
            <span className="text-[11px] text-muted-foreground font-medium block">Projected Net Savings</span>
            <span
              className={`text-lg font-bold ${
                forecast.expectedSavings >= 0 ? 'text-accent' : 'text-destructive'
              }`}
            >
              {forecast.expectedSavings >= 0 ? '+' : ''}₹{forecast.expectedSavings.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Trajectory Area Chart */}
        <div className="h-[240px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast.points} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `₹${Math.round(val / 1000)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-popover p-2.5 shadow-md text-xs space-y-1">
                        <div className="font-semibold text-foreground">{data.date}</div>
                        <div className="text-accent font-medium">
                          Balance: ₹{data.projectedBalance.toLocaleString('en-IN')}
                        </div>
                        <div className="text-muted-foreground">
                          Income: +₹{data.expectedIncome.toLocaleString('en-IN')}
                        </div>
                        <div className="text-muted-foreground">
                          Expenses: -₹{data.expectedExpenses.toLocaleString('en-IN')}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="projectedBalance"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#balanceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
