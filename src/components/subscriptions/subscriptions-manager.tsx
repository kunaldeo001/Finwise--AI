'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Repeat,
  PlusCircle,
  Sparkles,
  Calendar,
  Bell,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { SubscriptionItem } from '@/lib/types/finance';
import { useToast } from '@/hooks/use-toast';

export function SubscriptionsManager() {
  const finwise = useFinwiseData();
  const { toast } = useToast();

  const [subscriptionsList, setSubscriptionsList] = useState<SubscriptionItem[]>(
    finwise.subscriptionIntelligence.subscriptions
  );

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    merchant: '',
    category: 'Subscriptions',
    monthlyAmount: '',
    frequency: 'monthly' as 'monthly' | 'yearly',
  });

  const handleToggleReminder = (id: string) => {
    setSubscriptionsList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, reminderEnabled: !s.reminderEnabled } : s))
    );
    toast({ title: 'Reminder Status Updated' });
  };

  const handleToggleStatus = (id: string, newStatus: 'active' | 'ignored' | 'cancelled') => {
    setSubscriptionsList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
    toast({ title: `Subscription marked as ${newStatus}` });
  };

  const handleDelete = (id: string) => {
    setSubscriptionsList((prev) => prev.filter((s) => s.id !== id));
    toast({ title: 'Subscription Removed' });
  };

  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formData.monthlyAmount);
    if (isNaN(amt) || amt <= 0 || !formData.merchant.trim()) return;

    const newSub: SubscriptionItem = {
      id: `sub-${Date.now()}`,
      merchant: formData.merchant.trim(),
      category: formData.category,
      monthlyAmount: amt,
      annualAmount: amt * 12,
      frequency: formData.frequency,
      status: 'active',
      reminderEnabled: true,
      detectedFromTransactionsCount: 1,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().substring(0, 10),
    };

    setSubscriptionsList([newSub, ...subscriptionsList]);
    setIsAddOpen(false);
    setFormData({ merchant: '', category: 'Subscriptions', monthlyAmount: '', frequency: 'monthly' });
    toast({ title: 'Subscription Added', description: `Tracking ${newSub.merchant} at ₹${amt}/mo.` });
  };

  const activeSubs = subscriptionsList.filter((s) => s.status === 'active');
  const monthlyTotal = activeSubs.reduce((s, sub) => s + sub.monthlyAmount, 0);
  const annualTotal = monthlyTotal * 12;

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] text-muted-foreground uppercase font-medium">Monthly Outflow</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground">
              ₹{monthlyTotal.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Automatic recurring commitments</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] text-muted-foreground uppercase font-medium">Annual Recurring Total</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-destructive">
              ₹{annualTotal.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total yearly subscription cost</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] text-muted-foreground uppercase font-medium">Active Mandates</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-accent">
              {activeSubs.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Detected streaming, SaaS, utilities</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] text-muted-foreground uppercase font-medium">Annual Audit Opportunity</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-emerald-400">
              ₹{Math.round(annualTotal * 0.25).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Est. 25% savings by trimming duplicate services</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Subscription Insight Banner */}
      <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent shrink-0">
            <Sparkles className="size-4" />
          </div>
          <div>
            <span className="font-semibold text-accent text-sm block">AI Subscription Intelligence</span>
            <p className="text-foreground mt-0.5">
              You are spending approximately <span className="font-bold">₹{annualTotal.toLocaleString('en-IN')}/year</span> on recurring digital services. Your largest recurring charge is {activeSubs[0]?.merchant || 'Netflix'}.
            </p>
          </div>
        </div>

        <Button size="sm" onClick={() => setIsAddOpen(true)} className="h-8 text-xs gap-1.5 shrink-0">
          <PlusCircle className="size-3.5" />
          Track New Subscription
        </Button>
      </div>

      {/* Subscriptions Table */}
      <Card className="shadow-sm border border-border/70">
        <CardHeader className="p-4 sm:p-6 border-b">
          <CardTitle className="text-base font-semibold">Detected Subscriptions & Recurring Mandates</CardTitle>
          <CardDescription className="text-xs">
            Review auto-debits, set renewal reminder alerts, and mark inactive services
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent text-xs">
                <TableHead>Service / Merchant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Monthly (₹)</TableHead>
                <TableHead className="text-right">Annualized (₹)</TableHead>
                <TableHead>Next Billing Date</TableHead>
                <TableHead className="text-center">Renewal Reminder</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptionsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                    No recurring subscriptions detected.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptionsList.map((sub) => (
                  <TableRow key={sub.id} className="text-xs hover:bg-muted/30">
                    <TableCell>
                      <div className="font-semibold text-foreground">{sub.merchant}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {sub.frequency === 'monthly' ? 'Monthly auto-debit' : 'Annual billing'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] py-0">
                        {sub.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      ₹{sub.monthlyAmount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right font-medium text-muted-foreground">
                      ₹{sub.annualAmount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-muted-foreground flex items-center gap-1 font-mono">
                      <Calendar className="size-3" />
                      {sub.nextBillingDate || 'Auto-renewal'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={sub.reminderEnabled}
                        onCheckedChange={() => handleToggleReminder(sub.id)}
                        className="scale-75"
                      />
                    </TableCell>
                    <TableCell>
                      <select
                        value={sub.status}
                        onChange={(e) => handleToggleStatus(sub.id, e.target.value as any)}
                        className="text-xs bg-muted/60 border border-border rounded px-2 py-1 text-foreground"
                      >
                        <option value="active">Active</option>
                        <option value="ignored">Ignored</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(sub.id)}
                        className="size-7 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Subscription Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Recurring Subscription</DialogTitle>
            <DialogDescription className="text-xs">
              Record a software, streaming, gym, or utility subscription to track annual recurring expense burden.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubscription} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Merchant / Service Name</label>
              <Input
                placeholder="e.g. Netflix, Spotify, ChatGPT Plus, Gym"
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Monthly Cost (₹)</label>
                <Input
                  type="number"
                  placeholder="649"
                  value={formData.monthlyAmount}
                  onChange={(e) => setFormData({ ...formData, monthlyAmount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Billing Cycle</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                  className="w-full text-xs h-9 bg-background border border-border rounded-md px-3"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Add Subscription
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
