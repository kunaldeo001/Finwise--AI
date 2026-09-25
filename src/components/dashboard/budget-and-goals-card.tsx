'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target, PieChart, ArrowRight, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import Link from 'next/link';

export function BudgetAndGoalsSummaryCard() {
  const { budgetStatuses, goalOptimizedList } = useFinwiseData();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 10. Budget Velocity & Status */}
      <Card className="shadow-sm border border-border/70">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <PieChart className="size-4 text-accent" />
              <CardTitle className="text-base font-semibold">Budget Velocity & Projections</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Daily burn rate pacing and month-end spending forecasts.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs text-accent gap-1">
            <Link href="/budgets">
              Manage Budgets <ArrowRight className="size-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {budgetStatuses.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No budgets configured yet.</p>
          ) : (
            budgetStatuses.slice(0, 4).map((status) => {
              const variance = status.budget.limit - status.spent;
              const isOver = status.isOverBudget;
              const isPacingOver = status.projectedMonthEndSpend > status.budget.limit;

              return (
                <div key={status.budget.id || status.budget.category} className="space-y-1.5 p-2.5 rounded-lg bg-muted/20 border border-border/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{status.budget.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        ₹{status.spent.toLocaleString('en-IN')}{' '}
                        <span className="text-muted-foreground font-normal">/ ₹{status.budget.limit.toLocaleString('en-IN')}</span>
                      </span>
                      {isOver ? (
                        <Badge variant="destructive" className="text-[9px] py-0 px-1">Exceeded</Badge>
                      ) : isPacingOver ? (
                        <Badge variant="outline" className="text-amber-400 border-amber-500/40 text-[9px] py-0 px-1">Pacing Over</Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 text-[9px] py-0 px-1">Safe Pace</Badge>
                      )}
                    </div>
                  </div>

                  <Progress
                    value={Math.min(100, status.percentage)}
                    className="h-1.5 bg-muted"
                  />

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                    <span>
                      Projected Month-End: <strong className={isPacingOver ? 'text-amber-400' : 'text-foreground'}>₹{status.projectedMonthEndSpend.toLocaleString('en-IN')}</strong>
                    </span>
                    <span>
                      {variance >= 0 ? `₹${variance.toLocaleString('en-IN')} left` : `₹${Math.abs(variance).toLocaleString('en-IN')} over`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 11. Goal Progress & Shortfall Optimization */}
      <Card className="shadow-sm border border-border/70">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-accent" />
              <CardTitle className="text-base font-semibold">Goal Progress & Optimization</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Dynamic milestone pacing with required monthly contribution tracking.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs text-accent gap-1">
            <Link href="/goals">
              All Goals <ArrowRight className="size-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {goalOptimizedList.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No goals active yet.</p>
          ) : (
            goalOptimizedList.slice(0, 4).map(({ goal, metrics }) => {
              const getStatusBadge = () => {
                switch (metrics.status) {
                  case 'ON TRACK':
                    return <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 text-[9px] py-0 px-1.5 gap-1"><CheckCircle className="size-2.5" /> ON TRACK</Badge>;
                  case 'AT RISK':
                    return <Badge variant="outline" className="text-amber-400 border-amber-500/40 text-[9px] py-0 px-1.5 gap-1"><AlertTriangle className="size-2.5" /> AT RISK</Badge>;
                  case 'BEHIND':
                    return <Badge variant="destructive" className="text-[9px] py-0 px-1.5 gap-1"><Clock className="size-2.5" /> BEHIND</Badge>;
                }
              };

              return (
                <div key={goal.id || goal.name} className="space-y-1.5 p-2.5 rounded-lg bg-muted/20 border border-border/40">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">{goal.name}</span>
                      {getStatusBadge()}
                    </div>
                    <span className="font-semibold text-foreground">
                      ₹{goal.currentAmount.toLocaleString('en-IN')}{' '}
                      <span className="text-muted-foreground font-normal">/ ₹{goal.targetAmount.toLocaleString('en-IN')}</span>
                    </span>
                  </div>

                  <Progress value={metrics.progressPercentage} className="h-1.5 bg-muted" />

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                    <span>Target Date: {goal.targetDate}</span>
                    <span>
                      {metrics.status === 'BEHIND' ? (
                        <span className="text-destructive font-medium">Need +₹{metrics.shortfallPerMonth.toLocaleString('en-IN')}/mo</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">₹{metrics.requiredMonthlySavings.toLocaleString('en-IN')}/mo target</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
