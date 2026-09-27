'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PlusCircle,
  AlertTriangle,
  Sparkles,
  Trash2,
  Edit2,
  Wallet,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { addBudget, deleteBudget, updateBudget } from '@/lib/finance/firestore-service';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Subscriptions',
  'Travel',
  'Education',
  'Personal Care',
  'Housing & Rent',
  'Other',
];

export function BudgetManager() {
  const finwise = useFinwiseData();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: 'Food & Dining',
    limit: '',
    alertThresholdPercent: '80',
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      category: 'Food & Dining',
      limit: '',
      alertThresholdPercent: '80',
      notes: '',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (b: any) => {
    setEditingId(b.id);
    setFormData({
      category: b.category,
      limit: b.limit.toString(),
      alertThresholdPercent: (b.alertThresholdPercent || 80).toString(),
      notes: b.notes || '',
    });
    setIsAddOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(formData.limit);
    if (isNaN(limitNum) || limitNum <= 0) {
      toast({ variant: 'destructive', title: 'Invalid limit', description: 'Please enter a valid amount.' });
      return;
    }

    if (!finwise.firestore || !finwise.user?.uid) {
      toast({
        title: 'Demo Session',
        description: 'Budget saved in local session. Sign in to sync permanently.',
      });
      setIsAddOpen(false);
      return;
    }

    try {
      if (editingId) {
        await updateBudget(finwise.firestore, finwise.user.uid, editingId, {
          category: formData.category,
          limit: limitNum,
          alertThresholdPercent: parseInt(formData.alertThresholdPercent, 10),
          notes: formData.notes,
        });
        toast({ title: 'Budget Updated', description: `Limit set to ₹${limitNum.toLocaleString('en-IN')}.` });
      } else {
        await addBudget(finwise.firestore, finwise.user.uid, {
          category: formData.category,
          limit: limitNum,
          period: 'monthly',
          alertThresholdPercent: parseInt(formData.alertThresholdPercent, 10),
          notes: formData.notes,
        });
        toast({ title: 'Budget Created', description: `Created budget for ${formData.category}.` });
      }
      setIsAddOpen(false);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!finwise.firestore || !finwise.user?.uid) {
      toast({ title: 'Sample Budget Removed' });
      return;
    }
    try {
      await deleteBudget(finwise.firestore, finwise.user.uid, id);
      toast({ title: 'Budget Deleted' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: err.message });
    }
  };

  // KPIs
  const totalBudgeted = finwise.budgetStatuses.reduce((s, b) => s + b.limit, 0);
  const totalSpentInBudgets = finwise.budgetStatuses.reduce((s, b) => s + b.spent, 0);
  const overspentCount = finwise.budgetStatuses.filter((b) => b.isOverBudget).length;
  const warningCount = finwise.budgetStatuses.filter((b) => b.status === 'warning').length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden shadow-xs border border-border/70 hover:border-slate-500/40 hover:shadow-md transition-all duration-200 before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-slate-500">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Total Budgeted</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold tracking-tight text-foreground font-sans tabular-nums">₹{totalBudgeted.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">{finwise.budgetStatuses.length} active categories</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-xs border border-border/70 hover:border-rose-500/40 hover:shadow-md transition-all duration-200 before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-rose-500">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Budget Spent</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold tracking-tight text-rose-400 font-sans tabular-nums">
              ₹{totalSpentInBudgets.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalBudgeted > 0 ? ((totalSpentInBudgets / totalBudgeted) * 100).toFixed(0) : 0}% of allocation
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-xs border border-border/70 hover:border-emerald-500/40 hover:shadow-md transition-all duration-200 before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-emerald-500">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Remaining Room</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold tracking-tight text-emerald-400 font-sans tabular-nums">
              ₹{Math.max(0, totalBudgeted - totalSpentInBudgets).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Available buffer this month</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-xs border border-border/70 hover:border-amber-500/40 hover:shadow-md transition-all duration-200 before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-amber-500">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Categories At Risk</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold tracking-tight text-amber-400 font-sans tabular-nums">
              {overspentCount + warningCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overspentCount} exceeded, {warningCount} near threshold
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Active Category Budgets</h3>
          <p className="text-xs text-muted-foreground">
            Real-time tracking of current month spending against predetermined caps
          </p>
        </div>
        <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
          <PlusCircle className="size-3.5" />
          Add Category Budget
        </Button>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {finwise.budgetStatuses.map(({ budget, spent, limit, remaining, percentage, isOverBudget, status, projectedMonthEndSpend }) => {
          const isWarning = status === 'warning';
          const isDanger = status === 'exceeded' || isOverBudget;

          const getBudgetFillColor = (pct: number) => {
            if (pct > 100) return 'bg-rose-500';
            if (pct >= 90) return 'bg-amber-500';
            if (pct >= 70) return 'bg-sky-500';
            return 'bg-emerald-500';
          };

          return (
            <Card
              key={budget.id}
              className={cn(
                'shadow-sm border transition-all duration-200 flex flex-col justify-between group',
                isDanger
                  ? 'border-rose-500/40 bg-rose-500/5 hover:border-rose-500/60'
                  : isWarning
                  ? 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60'
                  : 'border-border/70 hover:border-emerald-500/40 hover:bg-secondary/20'
              )}
            >
              <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground group-hover:text-emerald-400 transition-colors">{budget.category}</CardTitle>
                  <CardDescription className="text-xs">
                    Monthly spending cap: ₹{limit.toLocaleString('en-IN')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(budget)}
                    className="size-7 text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(budget.id)}
                    className="size-7 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 py-2 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-sans tabular-nums text-foreground">₹{spent.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    of ₹{limit.toLocaleString('en-IN')} ({percentage}%)
                  </span>
                </div>

                <Progress
                  value={Math.min(100, percentage)}
                  className="h-2 bg-muted/60"
                  indicatorClassName={getBudgetFillColor(percentage)}
                />

                {/* AI Overspend Warning & Projection */}
                <div className="p-2.5 rounded-lg bg-card/80 border border-border/40 text-xs space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <Sparkles className="size-3" />
                    AI Velocity Insight
                  </div>
                  {isDanger ? (
                    <p className="text-rose-400 font-medium">
                      Exceeded by ₹{Math.abs(remaining).toLocaleString('en-IN')}. Pause non-essential {budget.category} purchases.
                    </p>
                  ) : projectedMonthEndSpend > limit ? (
                    <p className="text-amber-400 font-medium">
                      At your current spending rate, you may exceed this budget by approximately ₹{(projectedMonthEndSpend - limit).toLocaleString('en-IN')}.
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      You have used {percentage}% of your budget. On track to stay within limits.
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-1 flex justify-between items-center text-xs border-t border-border/40">
                <span className={cn('font-mono', isDanger ? 'text-rose-400 font-semibold' : 'text-muted-foreground')}>
                  {remaining >= 0
                    ? `₹${remaining.toLocaleString('en-IN')} remaining`
                    : `₹${Math.abs(remaining).toLocaleString('en-IN')} over budget`}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] py-0 font-mono',
                    isDanger
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                      : isWarning
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  )}
                >
                  {isDanger ? 'Over Budget' : isWarning ? 'Near Limit' : 'Healthy'}
                </Badge>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Budget Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Budget' : 'Add Category Budget'}</DialogTitle>
            <DialogDescription className="text-xs">
              Set monthly spending thresholds to receive intelligent alerts before overspending.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Category</label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Monthly Limit (₹)</label>
              <Input
                type="number"
                placeholder="e.g. 15000"
                value={formData.limit}
                onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Warning Alert Threshold (%)</label>
              <Input
                type="number"
                min="50"
                max="95"
                value={formData.alertThresholdPercent}
                onChange={(e) => setFormData({ ...formData, alertThresholdPercent: e.target.value })}
              />
              <span className="text-[10px] text-muted-foreground">
                Alert will trigger when spending reaches this percentage.
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {editingId ? 'Save Changes' : 'Create Budget'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
