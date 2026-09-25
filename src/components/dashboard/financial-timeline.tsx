'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  ArrowUpRight,
  ShoppingBag,
  CreditCard,
  Target,
  Sparkles,
  TrendingUp,
  Repeat,
  AlertTriangle,
} from 'lucide-react';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { cn } from '@/lib/utils';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  category: string;
  amount?: number;
  type: 'income' | 'expense' | 'milestone' | 'alert' | 'investment';
  icon: typeof Clock;
  badgeText: string;
}

export function FinancialTimeline() {
  const { transactions, goals, debts, budgets, budgetStatuses } = useFinwiseData();

  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // 1. Transaction events (Salary, Large expenses, Subscriptions)
    transactions.forEach((tx) => {
      if (tx.type === 'income' && tx.amount >= 20000) {
        events.push({
          id: `tl-inc-${tx.id}`,
          date: tx.date,
          title: `Salary Received: ${tx.merchant}`,
          description: `Direct deposit credited to primary account.`,
          category: 'Income',
          amount: tx.amount,
          type: 'income',
          icon: ArrowUpRight,
          badgeText: 'Inflow',
        });
      } else if (tx.amount >= 4000 && tx.type === 'expense') {
        events.push({
          id: `tl-exp-${tx.id}`,
          date: tx.date,
          title: `Large Purchase: ${tx.merchant}`,
          description: `Discretionary / capital expense on ${tx.category}.`,
          category: tx.category,
          amount: tx.amount,
          type: 'expense',
          icon: ShoppingBag,
          badgeText: 'Significant Expense',
        });
      } else if (tx.isRecurring || tx.category === 'Subscriptions') {
        events.push({
          id: `tl-sub-${tx.id}`,
          date: tx.date,
          title: `Subscription Debit: ${tx.merchant}`,
          description: `Recurring digital membership renewed.`,
          category: 'Subscriptions',
          amount: tx.amount,
          type: 'expense',
          icon: Repeat,
          badgeText: 'Auto-Debit',
        });
      }
    });

    // 2. Budget threshold alerts
    budgetStatuses.filter((b) => b.isOverBudget).forEach((b) => {
      events.push({
        id: `tl-bgt-${b.budget.id}`,
        date: '2026-09-20',
        title: `Budget Exceeded: ${b.budget.category}`,
        description: `Total spent ₹${b.spent.toLocaleString('en-IN')} exceeded the ₹${b.budget.limit.toLocaleString('en-IN')} limit.`,
        category: 'Budget',
        type: 'alert',
        icon: AlertTriangle,
        badgeText: 'Budget Alert',
      });
    });

    // 3. Goal milestones
    goals.forEach((g) => {
      const pct = Math.round((g.currentAmount / (g.targetAmount || 1)) * 100);
      if (pct >= 50) {
        events.push({
          id: `tl-goal-${g.id}`,
          date: '2026-09-15',
          title: `Goal Milestone: ${g.name} (${pct}%)`,
          description: `Accumulated ₹${g.currentAmount.toLocaleString('en-IN')} towards your ₹${g.targetAmount.toLocaleString('en-IN')} target.`,
          category: 'Goal',
          type: 'milestone',
          icon: Target,
          badgeText: 'Milestone',
        });
      }
    });

    // 4. Loan EMI payment milestones
    debts.forEach((d) => {
      events.push({
        id: `tl-debt-${d.id}`,
        date: new Date().toISOString().substring(0, 10),
        title: `Loan EMI Scheduled: ${d.name}`,
        description: `Monthly installment of ₹${d.emi.toLocaleString('en-IN')} scheduled.`,
        category: 'Debt',
        amount: d.emi,
        type: 'expense',
        icon: CreditCard,
        badgeText: 'Loan EMI',
      });
    });

    // Sort descending by date
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7);
  }, [transactions, goals, debts, budgetStatuses]);

  return (
    <Card className="shadow-sm border border-border/70">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-accent" />
            <CardTitle className="text-base font-semibold">Personal Finance Timeline</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Chronological narrative of major financial milestones, recurring auto-debits, and alerts.
          </CardDescription>
        </div>
        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/60">
          Chronological Activity
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {timelineEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No timeline events recorded yet. Add transactions or import a bank statement.
          </p>
        ) : (
          <div className="relative pl-6 border-l-2 border-border/60 space-y-6">
            {timelineEvents.map((evt) => {
              const Icon = evt.icon;
              return (
                <div key={evt.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-0.5 size-4 rounded-full bg-background border-2 border-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                    <div className="size-1.5 rounded-full bg-accent" />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{evt.title}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] py-0 px-1',
                            evt.type === 'income' && 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
                            evt.type === 'alert' && 'text-amber-400 border-amber-500/30 bg-amber-500/10',
                            evt.type === 'milestone' && 'text-accent border-accent/30 bg-accent/10',
                            evt.type === 'expense' && 'text-foreground border-border/60'
                          )}
                        >
                          {evt.badgeText}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{evt.description}</p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between text-right shrink-0">
                      <span className="text-[10px] text-muted-foreground font-mono">{evt.date}</span>
                      {evt.amount !== undefined && (
                        <span
                          className={cn(
                            'font-semibold text-xs',
                            evt.type === 'income' ? 'text-emerald-400' : 'text-foreground'
                          )}
                        >
                          {evt.type === 'income' ? '+' : ''}₹{evt.amount.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
