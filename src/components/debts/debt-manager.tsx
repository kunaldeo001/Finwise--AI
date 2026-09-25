'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  PlusCircle,
  Calculator,
  Sparkles,
  TrendingDown,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { DebtItem } from '@/lib/types/finance';
import { calculateEMI, calculateDebtPayoff } from '@/lib/finance/calculations';
import { addDebt, updateDebt, deleteDebt } from '@/lib/finance/firestore-service';
import { useToast } from '@/hooks/use-toast';

const DEBT_CATEGORIES: DebtItem['category'][] = [
  'Home Loan',
  'Personal Loan',
  'Car Loan',
  'Education Loan',
  'Credit Card',
  'Other',
];

export function DebtManager() {
  const finwise = useFinwiseData();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Prepayment simulator state
  const [selectedDebtId, setSelectedDebtId] = useState<string>('');
  const [extraPayment, setExtraPayment] = useState<number>(2000);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    principal: '',
    interestRate: '8.5',
    tenureMonths: '60',
    remainingBalance: '',
    startDate: new Date().toISOString().substring(0, 10),
    category: 'Personal Loan' as DebtItem['category'],
    extraMonthlyPayment: '0',
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      principal: '',
      interestRate: '8.5',
      tenureMonths: '60',
      remainingBalance: '',
      startDate: new Date().toISOString().substring(0, 10),
      category: 'Personal Loan',
      extraMonthlyPayment: '0',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (debt: DebtItem) => {
    setEditingId(debt.id);
    setFormData({
      name: debt.name,
      principal: debt.principal.toString(),
      interestRate: debt.interestRate.toString(),
      tenureMonths: debt.tenureMonths.toString(),
      remainingBalance: debt.remainingBalance.toString(),
      startDate: debt.startDate,
      category: debt.category,
      extraMonthlyPayment: (debt.extraMonthlyPayment || 0).toString(),
    });
    setIsAddOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(formData.principal);
    const rate = parseFloat(formData.interestRate);
    const tenure = parseInt(formData.tenureMonths, 10);
    const remaining = parseFloat(formData.remainingBalance || formData.principal);
    const extra = parseFloat(formData.extraMonthlyPayment || '0');

    if (isNaN(principal) || principal <= 0 || isNaN(rate) || tenure <= 0 || !formData.name.trim()) {
      toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please complete all loan fields.' });
      return;
    }

    const emi = calculateEMI(principal, rate, tenure);

    if (!finwise.firestore || !finwise.user?.uid) {
      toast({ title: 'Demo Session', description: 'Debt recorded in local view.' });
      setIsAddOpen(false);
      return;
    }

    try {
      if (editingId) {
        await updateDebt(finwise.firestore, finwise.user.uid, editingId, {
          name: formData.name.trim(),
          principal,
          interestRate: rate,
          tenureMonths: tenure,
          emi,
          remainingBalance: remaining,
          startDate: formData.startDate,
          category: formData.category,
          extraMonthlyPayment: extra,
        });
        toast({ title: 'Debt Updated' });
      } else {
        await addDebt(finwise.firestore, finwise.user.uid, {
          name: formData.name.trim(),
          principal,
          interestRate: rate,
          tenureMonths: tenure,
          emi,
          remainingBalance: remaining,
          startDate: formData.startDate,
          category: formData.category,
          extraMonthlyPayment: extra,
        });
        toast({ title: 'Loan Added', description: `Calculated monthly EMI: ₹${emi.toLocaleString('en-IN')}` });
      }
      setIsAddOpen(false);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!finwise.firestore || !finwise.user?.uid) {
      toast({ title: 'Sample Debt Removed' });
      return;
    }
    try {
      await deleteDebt(finwise.firestore, finwise.user.uid, id);
      toast({ title: 'Debt Deleted' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  // Selected loan for simulator
  const activeDebtForSimulator = useMemo(() => {
    if (finwise.debts.length === 0) return null;
    return finwise.debts.find((d) => d.id === selectedDebtId) || finwise.debts[0];
  }, [finwise.debts, selectedDebtId]);

  // Simulator calculation
  const simulationResult = useMemo(() => {
    if (!activeDebtForSimulator) return null;
    return calculateDebtPayoff(
      activeDebtForSimulator.remainingBalance,
      activeDebtForSimulator.interestRate,
      activeDebtForSimulator.emi,
      extraPayment
    );
  }, [activeDebtForSimulator, extraPayment]);

  const totalOutstanding = finwise.debts.reduce((s, d) => s + (d.remainingBalance || 0), 0);
  const totalMonthlyEmi = finwise.debts.reduce((s, d) => s + (d.emi || 0), 0);
  const dti = finwise.totals.currentMonthIncome > 0 ? (totalMonthlyEmi / finwise.totals.currentMonthIncome) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs text-muted-foreground font-medium uppercase">
              Total Outstanding Balance
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground">
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{finwise.debts.length} active loans & credit lines</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs text-muted-foreground font-medium uppercase">Monthly EMI Outflow</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-destructive">
              ₹{totalMonthlyEmi.toLocaleString('en-IN')}/mo
            </div>
            <p className="text-xs text-muted-foreground mt-1">Obligatory monthly debt service</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs text-muted-foreground font-medium uppercase">
              Debt-to-Income (DTI)
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className={`text-2xl font-bold ${dti > 40 ? 'text-destructive' : 'text-accent'}`}>
              {dti.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dti <= 35 ? 'Safe leverage range (<35%)' : 'High debt exposure (>35%)'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* "What If I Pay Extra?" Simulator (Phase 10) */}
      {activeDebtForSimulator && simulationResult && (
        <Card className="border border-accent/40 bg-accent/5 shadow-sm">
          <CardHeader className="p-4 pb-3 border-b border-accent/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-accent">
                  <Calculator className="size-4" />
                  &quot;What If I Pay Extra?&quot; Payoff Simulator
                </CardTitle>
                <CardDescription className="text-xs">
                  Simulate accelerating loan principal payoff and saving thousands in interest charges
                </CardDescription>
              </div>

              {/* Loan picker */}
              {finwise.debts.length > 1 && (
                <div className="w-[200px]">
                  <Select
                    value={activeDebtForSimulator.id}
                    onValueChange={(val) => setSelectedDebtId(val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Select Loan" />
                    </SelectTrigger>
                    <SelectContent>
                      {finwise.debts.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-baseline text-xs">
                <span className="font-medium text-foreground">
                  Extra Monthly Prepayment for &quot;{activeDebtForSimulator.name}&quot;
                </span>
                <span className="text-base font-bold text-accent">
                  +₹{extraPayment.toLocaleString('en-IN')}/month
                </span>
              </div>

              <Slider
                value={[extraPayment]}
                min={0}
                max={25000}
                step={500}
                onValueChange={(val) => setExtraPayment(val[0])}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>₹0 (Standard EMI)</span>
                <span>₹10,000</span>
                <span>₹25,000 extra/mo</span>
              </div>
            </div>

            {/* Dynamic result callout */}
            <div className="p-3.5 rounded-xl bg-card border border-accent/30 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-accent font-semibold">
                <Sparkles className="size-3.5" />
                Payoff Acceleration Result
              </div>
              <p className="text-foreground leading-relaxed">
                If you pay <span className="font-bold text-accent">₹{extraPayment.toLocaleString('en-IN')} extra</span> per month, your loan will be paid off in{' '}
                <span className="font-bold">{simulationResult.acceleratedMonths} months</span> instead of {simulationResult.baseMonths} months — saving{' '}
                <span className="font-bold text-emerald-400">
                  {simulationResult.monthsSaved} months ({Math.floor(simulationResult.monthsSaved / 12)} yrs {simulationResult.monthsSaved % 12} mos)
                </span>{' '}
                and an estimated <span className="font-bold text-emerald-400">₹{simulationResult.interestSaved.toLocaleString('en-IN')}</span> in interest!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loans Ledger Table */}
      <Card className="shadow-sm border border-border/70">
        <CardHeader className="p-4 sm:p-6 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Active Loans & EMIs</CardTitle>
            <CardDescription className="text-xs">
              Manage interest rates, principal repayment schedules, and monthly debits
            </CardDescription>
          </div>
          <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 h-8">
            <PlusCircle className="size-3.5" />
            Add Loan
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent text-xs">
                <TableHead>Loan Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Interest Rate</TableHead>
                <TableHead className="text-right">Tenure</TableHead>
                <TableHead className="text-right">Monthly EMI</TableHead>
                <TableHead className="text-right">Remaining Balance</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finwise.debts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    No debts or loans recorded. Add your home, vehicle, or personal loans to track repayment.
                  </TableCell>
                </TableRow>
              ) : (
                finwise.debts.map((debt) => (
                  <TableRow key={debt.id} className="text-xs hover:bg-muted/30">
                    <TableCell>
                      <div className="font-semibold text-foreground">{debt.name}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3" /> Started: {debt.startDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] py-0">
                        {debt.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{debt.interestRate}% p.a.</TableCell>
                    <TableCell className="text-right text-muted-foreground">{debt.tenureMonths} mos</TableCell>
                    <TableCell className="text-right font-bold text-destructive">
                      ₹{debt.emi.toLocaleString('en-IN')}/mo
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      ₹{debt.remainingBalance.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(debt)}
                          className="size-7 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(debt.id)}
                          className="size-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Loan Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Loan' : 'Add Loan / EMI'}</DialogTitle>
            <DialogDescription className="text-xs">
              Calculate EMI and amortize remaining balance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Loan Name</label>
              <Input
                placeholder="e.g. HDFC Home Loan, Car Loan"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Original Principal (₹)</label>
                <Input
                  type="number"
                  placeholder="2000000"
                  value={formData.principal}
                  onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Remaining Balance (₹)</label>
                <Input
                  type="number"
                  placeholder="1750000"
                  value={formData.remainingBalance}
                  onChange={(e) => setFormData({ ...formData, remainingBalance: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Interest Rate (% per year)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="8.5"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Tenure (Total Months)</label>
                <Input
                  type="number"
                  placeholder="240"
                  value={formData.tenureMonths}
                  onChange={(e) => setFormData({ ...formData, tenureMonths: e.target.value })}
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
                    {DEBT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Start Date</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {editingId ? 'Update Loan' : 'Save Loan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
