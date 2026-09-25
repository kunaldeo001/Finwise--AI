'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Upload,
  Download,
  ScanLine,
  Search,
  Filter,
  Trash2,
  Sparkles,
  AlertTriangle,
  Repeat,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { Transaction, TransactionType, TransactionCategory } from '@/lib/types/finance';
import { autoCategorizeTransaction } from '@/lib/finance/intelligence';
import { addTransaction, deleteTransaction } from '@/lib/finance/firestore-service';
import { exportTransactionsCSV } from '@/lib/finance/export';
import { useToast } from '@/hooks/use-toast';
import { CSVImportDialog } from './csv-import-dialog';
import { ScanBill } from '@/components/expenses/scan-bill';

const CATEGORIES: TransactionCategory[] = [
  'Salary',
  'Freelance',
  'Food & Dining',
  'Transportation',
  'Housing & Rent',
  'Utilities',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Education',
  'Travel',
  'Debt & EMI',
  'Subscriptions',
  'Investments',
  'Other',
];

export function TransactionsManager() {
  const finwise = useFinwiseData();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);

  // Form states for manual transaction addition
  const [formData, setFormData] = useState({
    merchant: '',
    amount: '',
    type: 'expense' as TransactionType,
    category: 'Food & Dining',
    date: new Date().toISOString().substring(0, 10),
    isRecurring: false,
    paymentMethod: 'UPI' as const,
  });

  const handleMerchantChange = (val: string) => {
    const { category, cleanMerchant } = autoCategorizeTransaction(val);
    setFormData((prev) => ({
      ...prev,
      merchant: val,
      category: prev.category === 'Food & Dining' ? category : prev.category,
    }));
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0 || !formData.merchant.trim()) {
      toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please enter valid details.' });
      return;
    }

    if (!finwise.firestore || !finwise.user?.uid) {
      toast({
        title: 'Demo Session',
        description: 'Transaction recorded in local demo state. Sign in to sync permanently.',
      });
      setIsAddOpen(false);
      return;
    }

    try {
      await addTransaction(finwise.firestore, finwise.user.uid, {
        merchant: formData.merchant.trim(),
        amount: amt,
        type: formData.type,
        category: formData.category,
        date: formData.date,
        isRecurring: formData.isRecurring,
        paymentMethod: formData.paymentMethod,
        description: `Manual transaction - ${formData.merchant}`,
      });
      toast({ title: 'Transaction Saved', description: `Added ₹${amt.toLocaleString('en-IN')}.` });
      setIsAddOpen(false);
      setFormData({
        merchant: '',
        amount: '',
        type: 'expense',
        category: 'Food & Dining',
        date: new Date().toISOString().substring(0, 10),
        isRecurring: false,
        paymentMethod: 'UPI',
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to save.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!finwise.firestore || !finwise.user?.uid) {
      toast({ title: 'Notice', description: 'Sample transaction removed from demo view.' });
      return;
    }
    try {
      await deleteTransaction(finwise.firestore, finwise.user.uid, id);
      toast({ title: 'Deleted', description: 'Transaction removed.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: err.message });
    }
  };

  // Filtered transactions
  const filteredTransactions = finwise.transactions.filter((tx) => {
    const matchesSearch =
      tx.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || tx.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || tx.category === selectedCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* AI Expense Intelligence Cards (Phase 4) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* MoM Spending Intelligence */}
        <Card className="border border-border/70 bg-card/60 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-accent" />
              AI Spending Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-1 text-xs">
            {finwise.spendingMoM.summaryInsights.map((insight, idx) => (
              <p key={idx} className="text-muted-foreground leading-relaxed">
                • {insight}
              </p>
            ))}
          </CardContent>
        </Card>

        {/* Unusual Spending Anomalies */}
        <Card className="border border-border/70 bg-card/60 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="size-3.5" />
              Unusual Spending Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs">
            {finwise.unusualSpending.length > 0 ? (
              <div className="space-y-2">
                {finwise.unusualSpending.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="bg-amber-500/5 p-2 rounded border border-amber-500/20">
                    <span className="font-semibold text-foreground">{item.transaction.merchant}</span>: {item.reason}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No spending spikes detected. All expenses are within normal statistical ranges.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recurring Transactions Detected */}
        <Card className="border border-border/70 bg-card/60 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Repeat className="size-3.5" />
              Recurring Payments ({finwise.recurringTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs">
            {finwise.recurringTransactions.length > 0 ? (
              <div className="space-y-1.5">
                {finwise.recurringTransactions.slice(0, 3).map((r, idx) => (
                  <div key={idx} className="flex justify-between items-center text-muted-foreground">
                    <span className="truncate">{r.merchant}</span>
                    <span className="font-semibold text-foreground">
                      ₹{r.estimatedAmount.toLocaleString('en-IN')}/mo
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recurring subscription patterns detected yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Ledger Header Controls */}
      <Card className="shadow-sm border border-border/70">
        <CardHeader className="p-4 sm:p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Transactions Ledger</CardTitle>
              <CardDescription className="text-xs">
                Manage, filter, and track all incoming & outgoing cash flows
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* CSV Import */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCsvOpen(true)}
                className="h-8 text-xs gap-1.5"
              >
                <Upload className="size-3.5" />
                Import CSV
              </Button>

              {/* CSV Export */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportTransactionsCSV(finwise.transactions);
                  toast({
                    title: 'Transactions Exported',
                    description: `Successfully exported ${finwise.transactions.length} transactions as CSV.`,
                  });
                }}
                className="h-8 text-xs gap-1.5"
              >
                <Download className="size-3.5" />
                Export CSV
              </Button>

              {/* Scan Bill */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsScanOpen(true)}
                className="h-8 text-xs gap-1.5"
              >
                <ScanLine className="size-3.5" />
                Scan Bill
              </Button>

              {/* Add Transaction Dialog */}
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5">
                    <PlusCircle className="size-3.5" />
                    Add Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Transaction</DialogTitle>
                    <DialogDescription className="text-xs">
                      Record income or expense with automatic category suggestions.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSaveTransaction} className="space-y-4 py-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">Merchant / Description</label>
                      <Input
                        placeholder="e.g. Swiggy, Netflix, Salary, Uber"
                        value={formData.merchant}
                        onChange={(e) => handleMerchantChange(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Amount (₹)</label>
                        <Input
                          type="number"
                          placeholder="e.g. 1500"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Type</label>
                        <Select
                          value={formData.type}
                          onValueChange={(val: TransactionType) =>
                            setFormData({ ...formData, type: val })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expense">Expense</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Category</label>
                        <Select
                          value={formData.category}
                          onValueChange={(val) => setFormData({ ...formData, category: val })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Date</label>
                        <Input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="isRecurring"
                        checked={formData.isRecurring}
                        onChange={(e) =>
                          setFormData({ ...formData, isRecurring: e.target.checked })
                        }
                        className="rounded border-border text-accent focus:ring-accent"
                      />
                      <label htmlFor="isRecurring" className="text-xs text-muted-foreground cursor-pointer">
                        Mark as recurring monthly payment
                      </label>
                    </div>

                    <DialogFooter className="pt-4">
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" size="sm">
                        Save Transaction
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search transactions or merchants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            <div className="flex gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[120px] text-xs h-9">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px] text-xs h-9">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {/* Ledger Table */}
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent text-xs">
                <TableHead>Date</TableHead>
                <TableHead>Merchant / Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                    No transactions match your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';

                  return (
                    <TableRow key={tx.id} className="text-xs hover:bg-muted/30">
                      <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                        {tx.date}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          {tx.merchant}
                          {tx.isRecurring && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1 border-sky-400/40 text-sky-400">
                              Recurring
                            </Badge>
                          )}
                        </div>
                        {tx.description && (
                          <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                            {tx.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] py-0 font-normal">
                          {tx.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{tx.paymentMethod || 'UPI'}</TableCell>
                      <TableCell className="text-right font-bold whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-0.5 ${
                            isIncome ? 'text-emerald-400' : 'text-foreground'
                          }`}
                        >
                          {isIncome ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3 text-muted-foreground" />}
                          {isIncome ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(tx.id)}
                          className="size-7 text-muted-foreground hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CSV Import Dialog Component */}
      <CSVImportDialog
        open={isCsvOpen}
        onOpenChange={setIsCsvOpen}
        existingTransactions={finwise.transactions}
        firestore={finwise.firestore}
        userId={finwise.user?.uid || null}
        onSuccess={() => {}}
      />

      {/* Bill Scanner Dialog Component */}
      <Dialog open={isScanOpen} onOpenChange={setIsScanOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Receipt & Bill Scanner</DialogTitle>
            <DialogDescription className="text-xs">
              Upload a photo or receipt to automatically extract vendor, amount, date, and line items.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <ScanBill />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
