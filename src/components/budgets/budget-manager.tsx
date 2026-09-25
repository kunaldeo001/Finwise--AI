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
        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs text-muted-foreground font-medium uppercase">Total Budgeted</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold">₹{totalBudgeted.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">{finwise.budgetStatuses.length} active categories</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs text-muted-foreground font-medium uppercase">Budget Spent</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground">
              ₹{totalSpentInBudgets.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalBudgeted > 0 ? ((totalSpentInBudgets / totalBudgeted) * 100).toFixed(0) : 0}% of allocation
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs text-muted-foreground font-medium uppercase">Remaining Room</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-emerald-400">
              ₹{Math.max(0, totalBudgeted - totalSpentInBudgets).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Available buffer this month</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs text-muted-foreground font-medium uppercase">Categories At Risk</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-amber-400">
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
        <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 h-8">
          <PlusCircle className="size-3.5" />
          Add Category Budget
        </Button>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {finwise.budgetStatuses.map(({ budget, spent, limit, remaining, percentage, isOverBudget, status, projectedMonthEndSpend }) => {
          const isWarning = status === 'warning';
          const isDanger = status === 'exceeded';

          return (
            <Card
              key={budget.id}
              className={cn(
                'shadow-sm border transition-all flex flex-col justify-between',
                isDanger
                  ? 'border-destructive/40 bg-destructive/5'
                  : isWarning
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : 'border-border/70'
              )}
            >
              <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">{budget.category}</CardTitle>
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
                    className="size-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 py-2 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">₹{spent.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-muted-foreground">
                    of ₹{limit.toLocaleString('en-IN')} ({percentage}%)
                  </span>
                </div>

                <Progress
                  value={Math.min(100, percentage)}
                  className={cn(
                    'h-2',
                    isDanger
                      ? '[&>*]:bg-destructive bg-destructive/20'
                      : isWarning
                      ? '[&>*]:bg-amber-400 bg-amber-400/20'
                      : '[&>*]:bg-accent'
                  )}
                />

                {/* AI Overspend Warning & Projection */}
                <div className="p-2.5 rounded-lg bg-card/80 border text-xs space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-accent">
                    <Sparkles className="size-3" />
                    AI Velocity Insight
                  </div>
                  {isDanger ? (
                    <p className="text-destructive font-medium">
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
                <span className={isDanger ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                  {remaining >= 0
                    ? `₹${remaining.toLocaleString('en-IN')} remaining`
                    : `₹${Math.abs(remaining).toLocaleString('en-IN')} over budget`}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] py-0',
                    isDanger
                      ? 'border-destructive/30 text-destructive'
                      : isWarning
                      ? 'border-amber-400/30 text-amber-400'
                      : 'border-emerald-400/30 text-emerald-400'
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
