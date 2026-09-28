'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { deleteReceipt } from '@/lib/finance/firestore-service';
import { ReceiptRecord, ReceiptProcessingStatus } from '@/lib/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ScanLine,
  Receipt,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { ScanBill } from '@/components/expenses/scan-bill';
import { useToast } from '@/hooks/use-toast';

export function ReceiptsManager() {
  const finwise = useFinwiseData();
  const { toast } = useToast();

  const [isScanOpen, setIsScanOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const receiptsList = finwise.receipts;

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    return receiptsList.filter((r) => {
      const matchesSearch =
        r.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.receiptNumber && r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [receiptsList, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = receiptsList.length;
    const totalAmount = receiptsList.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const avgConfidence = total > 0 ? Math.round(receiptsList.reduce((sum, r) => sum + (r.confidence || 0), 0) / total) : 0;
    const needsReviewCount = receiptsList.filter((r) => r.status === 'NEEDS_REVIEW').length;

    return { total, totalAmount, avgConfidence, needsReviewCount };
  }, [receiptsList]);

  const handleDeleteReceipt = async (receiptId: string) => {
    try {
      if (finwise.isAuthenticated && finwise.firestore && finwise.user?.uid) {
        await deleteReceipt(finwise.firestore, finwise.user.uid, receiptId);
        toast({ title: 'Receipt Deleted', description: 'Archived document record removed.' });
      } else {
        toast({ title: 'Receipt Deleted', description: 'Record removed from demo session.' });
      }
      if (selectedReceipt?.id === receiptId) setSelectedReceipt(null);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: err.message });
    }
  };

  const getStatusBadge = (status: ReceiptProcessingStatus) => {
    switch (status) {
      case 'PROCESSED':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">PROCESSED</Badge>;
      case 'NEEDS_REVIEW':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">NEEDS REVIEW</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px]">FAILED</Badge>;
      default:
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px]">PROCESSING</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 bg-card/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Scanned Receipts</span>
            <Receipt className="size-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">{stats.total}</span>
            <span className="text-[11px] text-muted-foreground">documents</span>
          </div>
        </Card>

        <Card className="border border-border/80 bg-card/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Total Invoiced</span>
            <ScanLine className="size-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              ₹{stats.totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </Card>

        <Card className="border border-border/80 bg-card/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Avg OCR Accuracy</span>
            <Sparkles className="size-4 text-violet-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">{stats.avgConfidence}%</span>
            <span className="text-[11px] text-emerald-400 font-semibold">Calibrated</span>
          </div>
        </Card>

        <Card className="border border-border/80 bg-card/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Needs Attention</span>
            <AlertTriangle className="size-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">{stats.needsReviewCount}</span>
            <span className="text-[11px] text-muted-foreground">items</span>
          </div>
        </Card>
      </div>

      {/* Action Bar & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/80">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search vendor, category, or invoice #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs bg-background"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-8 text-xs bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="PROCESSED" className="text-xs">Processed</SelectItem>
              <SelectItem value="NEEDS_REVIEW" className="text-xs">Needs Review</SelectItem>
              <SelectItem value="FAILED" className="text-xs">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          size="sm"
          onClick={() => setIsScanOpen(true)}
          className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm shrink-0"
        >
          <ScanLine className="size-3.5" />
          Scan New Receipt
        </Button>
      </div>

      {/* Receipts Table / List */}
      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="size-4 text-emerald-400" />
                Document Ledger ({filteredReceipts.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Archived bills and invoices with extracted line items and confidence calibration.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredReceipts.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="size-10 rounded-xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Receipt className="size-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">No receipts found</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Scan your first paper receipt, supermarket bill, or PDF invoice to automatically track purchases.
              </p>
              <Button
                size="sm"
                onClick={() => setIsScanOpen(true)}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
              >
                <ScanLine className="size-3.5" />
                Scan Bill Now
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredReceipts.map((rec) => (
                <div
                  key={rec.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/20 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <Receipt className="size-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{rec.merchant}</span>
                        {getStatusBadge(rec.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="size-3" />
                          {rec.transactionDate}
                        </span>
                        <span>•</span>
                        <span>{rec.category}</span>
                        <span>•</span>
                        <span>{rec.paymentMethod}</span>
                        {rec.items && rec.items.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Layers className="size-3" />
                              {rec.items.length} items
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400">
                        ₹{rec.totalAmount.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {rec.confidence}% accuracy
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReceipt(rec)}
                        className="h-7 text-xs px-2.5"
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteReceipt(rec.id)}
                        className="size-7 text-muted-foreground hover:text-destructive"
                        title="Delete receipt"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan Bill Modal */}
      <Dialog open={isScanOpen} onOpenChange={setIsScanOpen}>
        <DialogContent className="max-w-xl p-5 bg-card border-border/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ScanLine className="size-4 text-emerald-400" />
              AI Receipt & Bill Scanner
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload or snap a photo of any grocery bill, restaurant invoice, or receipt to extract vendor, line items, and taxes.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-2">
            <ScanBill
              onSuccess={() => setIsScanOpen(false)}
              onCancel={() => setIsScanOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* View Receipt Details Modal */}
      {selectedReceipt && (
        <Dialog open={Boolean(selectedReceipt)} onOpenChange={(open) => { if (!open) setSelectedReceipt(null); }}>
          <DialogContent className="max-w-lg p-5 bg-card border-border/80">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Receipt className="size-4 text-emerald-400" />
                  {selectedReceipt.merchant}
                </DialogTitle>
                {getStatusBadge(selectedReceipt.status)}
              </div>
              <DialogDescription className="text-xs">
                Archived receipt recorded on {selectedReceipt.transactionDate}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-lg text-xs">
                <div>
                  <span className="text-muted-foreground">Total Amount</span>
                  <p className="text-base font-bold text-emerald-400">
                    ₹{selectedReceipt.totalAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Category</span>
                  <p className="font-semibold text-foreground">{selectedReceipt.category}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Mode</span>
                  <p className="font-semibold text-foreground">{selectedReceipt.paymentMethod}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Extraction Confidence</span>
                  <p className="font-semibold text-emerald-400">{selectedReceipt.confidence}%</p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground">
                  Purchased Items ({selectedReceipt.items?.length || 0})
                </span>
                {(!selectedReceipt.items || selectedReceipt.items.length === 0) ? (
                  <p className="text-xs text-muted-foreground italic">No individual item breakdown.</p>
                ) : (
                  <div className="divide-y divide-border/60 max-h-48 overflow-y-auto border border-border/80 rounded-lg">
                    {selectedReceipt.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 text-xs">
                        <div>
                          <span className="font-medium text-foreground">{item.name}</span>
                          {item.quantity && item.quantity > 1 && (
                            <span className="text-[11px] text-muted-foreground ml-2">
                              × {item.quantity} (@ ₹{item.unitPrice})
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-semibold text-foreground">
                          ₹{item.total.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedReceipt.notes && (
                <div className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-border/60">
                  <span className="font-medium text-foreground">Notes: </span>
                  {selectedReceipt.notes}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 text-xs gap-1.5"
                >
                  <Link href="/transactions">
                    <ExternalLink className="size-3.5" />
                    Open in Transactions
                  </Link>
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteReceipt(selectedReceipt.id)}
                  className="h-8 text-xs gap-1.5"
                >
                  <Trash2 className="size-3.5" />
                  Delete Record
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
