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
  Target,
  PlusCircle,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  ArrowUpRight,
  Shield,
  Laptop,
  Car,
  Plane,
  GraduationCap,
  Home,
  TrendingUp,
} from 'lucide-react';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { FinancialGoal } from '@/lib/types/finance';
import { calculateGoalMetrics } from '@/lib/finance/calculations';
import { addGoal, updateGoal, deleteGoal } from '@/lib/finance/firestore-service';
import { useToast } from '@/hooks/use-toast';
import { GoalForm } from './goal-form';

const GOAL_CATEGORIES: FinancialGoal['category'][] = [
  'Emergency Fund',
  'Laptop',
  'Car',
  'Travel',
  'Education',
  'House',
  'Investment',
  'Retirement',
  'Other',
];

const categoryIconMap: Record<string, any> = {
  'Emergency Fund': Shield,
  Laptop: Laptop,
  Car: Car,
  Travel: Plane,
  Education: GraduationCap,
  House: Home,
  Investment: TrendingUp,
};

export function GoalsManager() {
  const finwise = useFinwiseData();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAiPlanOpen, setIsAiPlanOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '2027-06-30',
    monthlyContribution: '',
    category: 'Emergency Fund' as FinancialGoal['category'],
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '0',
      targetDate: '2027-06-30',
      monthlyContribution: '',
      category: 'Emergency Fund',
      priority: 'medium',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: goal.targetDate,
      monthlyContribution: (goal.monthlyContribution || 0).toString(),
      category: goal.category,
      priority: goal.priority || 'medium',
    });
    setIsAddOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAmt = parseFloat(formData.targetAmount);
    const currentAmt = parseFloat(formData.currentAmount || '0');
    const monthlyAmt = parseFloat(formData.monthlyContribution || '0');

    if (isNaN(targetAmt) || targetAmt <= 0 || !formData.name.trim()) {
      toast({ variant: 'destructive', title: 'Invalid Goal', description: 'Please enter target amount and title.' });
      return;
    }

    if (!finwise.firestore || !finwise.user?.uid) {
      toast({
        title: 'Demo Session',
        description: 'Goal added to session. Sign in to save permanently.',
      });
      setIsAddOpen(false);
      return;
    }

    try {
      if (editingGoal) {
        await updateGoal(finwise.firestore, finwise.user.uid, editingGoal.id, {
          name: formData.name.trim(),
          targetAmount: targetAmt,
          currentAmount: currentAmt,
          targetDate: formData.targetDate,
          monthlyContribution: monthlyAmt,
          category: formData.category,
          priority: formData.priority,
        });
        toast({ title: 'Goal Updated', description: `Saved changes to "${formData.name}".` });
      } else {
        await addGoal(finwise.firestore, finwise.user.uid, {
          name: formData.name.trim(),
          targetAmount: targetAmt,
          currentAmount: currentAmt,
          targetDate: formData.targetDate,
          monthlyContribution: monthlyAmt,
          category: formData.category,
          status: 'active',
          priority: formData.priority,
        });
        toast({ title: 'Goal Created', description: `Created goal "${formData.name}".` });
      }
      setIsAddOpen(false);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: err.message });
    }
  };

  const handleContribute = async (goal: FinancialGoal, deltaAmount: number) => {
    const newAmount = goal.currentAmount + deltaAmount;
    if (!finwise.firestore || !finwise.user?.uid) {
      toast({ title: 'Simulated Contribution', description: `Added ₹${deltaAmount.toLocaleString('en-IN')} to ${goal.name}.` });
      return;
    }
    try {
      await updateGoal(finwise.firestore, finwise.user.uid, goal.id, {
        currentAmount: newAmount,
        status: newAmount >= goal.targetAmount ? 'completed' : 'active',
      });
      toast({
        title: newAmount >= goal.targetAmount ? '🎉 Goal Achieved!' : 'Contribution Recorded',
        description: `Added ₹${deltaAmount.toLocaleString('en-IN')} to ${goal.name}.`,
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!finwise.firestore || !finwise.user?.uid) {
      toast({ title: 'Goal Removed from demo session' });
      return;
    }
    try {
      await deleteGoal(finwise.firestore, finwise.user.uid, id);
      toast({ title: 'Goal Deleted' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Active Financial Goals</h3>
          <p className="text-xs text-muted-foreground">
            Track progress towards life targets, calculate required monthly savings, and simulate completion timelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAiPlanOpen(true)}
            className="h-8 text-xs gap-1.5 border-accent/40 text-accent"
          >
            <Sparkles className="size-3.5" />
            AI Goal Planner
          </Button>

          <Button size="sm" onClick={handleOpenAdd} className="h-8 text-xs gap-1.5">
            <PlusCircle className="size-3.5" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {finwise.goals.map((goal) => {
          const metrics = calculateGoalMetrics(goal);
          const IconComp = categoryIconMap[goal.category] || Target;

          return (
            <Card key={goal.id} className="shadow-sm border border-border/70 flex flex-col justify-between">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                      <IconComp className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{goal.name}</CardTitle>
                      <CardDescription className="text-xs">{goal.category}</CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(goal)}
                      className="size-7 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(goal.id)}
                      className="size-7 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 py-3 space-y-4">
                {/* Progress amounts */}
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-2xl font-bold">
                      ₹{goal.currentAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Target: ₹{goal.targetAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <Progress value={metrics.progressPercentage} className="h-2.5 bg-muted [&>*]:bg-accent" />
                  <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-1">
                    <span>{metrics.progressPercentage}% funded</span>
                    <span>₹{metrics.remainingAmount.toLocaleString('en-IN')} to go</span>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 p-2.5 rounded-lg border">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Monthly Saved</span>
                    <span className="font-semibold text-foreground">
                      ₹{(goal.monthlyContribution || 0).toLocaleString('en-IN')}/mo
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Required Velocity</span>
                    <span className="font-semibold text-foreground">
                      ₹{metrics.requiredMonthlySavings.toLocaleString('en-IN')}/mo
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Target Date</span>
                    <span className="font-medium text-foreground">{goal.targetDate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Pace Status</span>
                    <span
                      className={`font-semibold ${
                        metrics.isOnTrack ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {metrics.isOnTrack ? '✓ On Track' : `Behind by ₹${metrics.shortfallPerMonth}/mo`}
                    </span>
                  </div>
                </div>

                {/* Quick Contribute Buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-muted-foreground font-medium shrink-0">Quick Add:</span>
                  {[1000, 5000, 10000].map((amt) => (
                    <Button
                      key={amt}
                      variant="outline"
                      size="sm"
                      onClick={() => handleContribute(goal, amt)}
                      className="h-6 text-[10px] px-2"
                    >
                      +₹{amt.toLocaleString('en-IN')}
                    </Button>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-2 border-t border-border/50 flex justify-between items-center text-xs">
                <Badge
                  variant="outline"
                  className={metrics.isOnTrack ? 'border-emerald-400/40 text-emerald-400' : 'border-amber-400/40 text-amber-400'}
                >
                  {metrics.isOnTrack ? 'On Schedule' : 'Needs Adjustment'}
                </Badge>
                <span className="text-muted-foreground text-[11px]">
                  ~{metrics.monthsRemaining} months left
                </span>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Goal Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Financial Goal' : 'Create Financial Goal'}</DialogTitle>
            <DialogDescription className="text-xs">
              Define your financial ambition, deadline, and monthly savings allocation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveGoal} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Goal Name</label>
              <Input
                placeholder="e.g. Emergency Fund, New Car, House Down Payment"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Target Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="300000"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Current Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Monthly Contribution (₹)</label>
                <Input
                  type="number"
                  placeholder="15000"
                  value={formData.monthlyContribution}
                  onChange={(e) => setFormData({ ...formData, monthlyContribution: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Target Date</label>
                <Input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Category</label>
                <Select
                  value={formData.category}
                  onValueChange={(val: any) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(val: any) => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {editingGoal ? 'Update Goal' : 'Save Goal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Goal Planner Dialog (Preserving existing GoalForm Genkit flow!) */}
      <Dialog open={isAiPlanOpen} onOpenChange={setIsAiPlanOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              AI Goal Strategy Simulator
            </DialogTitle>
            <DialogDescription className="text-xs">
              Let the AI model simulate risk tolerance, time horizon, and compound investment strategies for your goal.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <GoalForm />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
