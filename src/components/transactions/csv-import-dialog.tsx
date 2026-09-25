'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, AlertCircle, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { parseTransactionCSV, CSVParseResult } from '@/lib/finance/csv-parser';
import { Transaction } from '@/lib/types/finance';
import { useToast } from '@/hooks/use-toast';
import { addTransaction } from '@/lib/finance/firestore-service';
import { Firestore } from 'firebase/firestore';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTransactions: Transaction[];
  firestore: Firestore | null;
  userId: string | null;
  onSuccess: () => void;
}

export function CSVImportDialog({
  open,
  onOpenChange,
  existingTransactions,
  firestore,
  userId,
  onSuccess,
}: CSVImportDialogProps) {
  const { toast } = useToast();
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = parseTransactionCSV(text, existingTransactions);
      setParseResult(result);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.validTransactions.length === 0) return;
    if (!firestore || !userId) {
      toast({
        title: 'Demo Import Simulated',
        description: `Validated and simulated importing ${parseResult.validTransactions.length} transactions. Sign in to sync permanently.`,
      });
      onOpenChange(false);
      onSuccess();
      return;
    }

    try {
      setIsImporting(true);
      for (const tx of parseResult.validTransactions) {
        await addTransaction(firestore, userId, tx);
      }
      toast({
        title: 'Import Successful',
        description: `Successfully imported ${parseResult.validTransactions.length} transactions into Firestore.`,
      });
      setParseResult(null);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: err.message || 'Error occurred while saving to Firestore.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5 text-accent" />
            Import Bank Statement / CSV
          </DialogTitle>
          <DialogDescription className="text-xs">
            Upload your bank statement or CSV ledger. Columns will be auto-matched, validated, and categorized.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* File picker */}
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/20 transition-colors">
            <input
              type="file"
              id="csvInput"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="csvInput" className="cursor-pointer flex flex-col items-center gap-2">
              <FileText className="size-8 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {fileName ? fileName : 'Click to select CSV file'}
              </span>
              <span className="text-xs text-muted-foreground">
                Supports HDFC, ICICI, SBI, and standard Date, Description, Amount, Debit/Credit files
              </span>
            </label>
          </div>

          {/* Parsing Results Summary */}
          {parseResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border bg-card text-center">
                  <div className="text-xs text-muted-foreground">Valid Rows</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {parseResult.validTransactions.length}
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-card text-center">
                  <div className="text-xs text-muted-foreground">Duplicates Skipped</div>
                  <div className="text-lg font-bold text-amber-400">
                    {parseResult.duplicateCount}
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-card text-center">
                  <div className="text-xs text-muted-foreground">Validation Errors</div>
                  <div className="text-lg font-bold text-destructive">
                    {parseResult.errors.length}
                  </div>
                </div>
              </div>

              {/* Errors List */}
              {parseResult.errors.length > 0 && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 space-y-1">
                  <div className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                    <AlertCircle className="size-3.5" />
                    Validation Issues ({parseResult.errors.length} rows excluded)
                  </div>
                  <ul className="text-[11px] text-muted-foreground space-y-1 pl-5 list-disc max-h-28 overflow-y-auto">
                    {parseResult.errors.slice(0, 5).map((e, idx) => (
                      <li key={idx}>
                        Row {e.rowNumber}: {e.reason}
                      </li>
                    ))}
                    {parseResult.errors.length > 5 && (
                      <li>...and {parseResult.errors.length - 5} more issues.</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Preview Table */}
              {parseResult.validTransactions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Preview (First 5 Transactions)
                  </h4>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs">
                          <TableHead>Date</TableHead>
                          <TableHead>Merchant / Desc</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parseResult.validTransactions.slice(0, 5).map((tx, idx) => (
                          <TableRow key={idx} className="text-xs">
                            <TableCell>{tx.date}</TableCell>
                            <TableCell className="font-medium">{tx.merchant}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] py-0">
                                {tx.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`font-semibold ${
                                  tx.type === 'income' ? 'text-emerald-400' : 'text-muted-foreground'
                                }`}
                              >
                                {tx.type}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              ₹{tx.amount.toLocaleString('en-IN')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmImport}
            disabled={!parseResult || parseResult.validTransactions.length === 0 || isImporting}
            className="gap-1.5"
          >
            {isImporting ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
            Confirm & Save ({parseResult?.validTransactions.length || 0})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
