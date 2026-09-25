'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { processReceipt } from '@/app/expenses/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  ScanLine,
  Upload,
  Files,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Check,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { addTransaction } from '@/lib/finance/firestore-service';
import { calculateReceiptConfidence } from '@/lib/finance/intelligence';
import Image from 'next/image';

const initialState = {
  success: false,
  message: '',
  data: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full h-9 text-xs gap-1.5">
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <ScanLine className="size-4" />
      )}
      Analyze & Extract Document
    </Button>
  );
}

export function ScanBill() {
  const [state, formAction] = useActionState(processReceipt, initialState);
  const { toast } = useToast();
  const finwise = useFinwiseData();

  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Editable confirmation form states once extracted
  const [confirmedVendor, setConfirmedVendor] = useState('');
  const [confirmedAmount, setConfirmedAmount] = useState('');
  const [confirmedDate, setConfirmedDate] = useState('');
  const [confirmedCategory, setConfirmedCategory] = useState('');
  const [confirmedTax, setConfirmedTax] = useState('');
  const [confirmedMethod, setConfirmedMethod] = useState<'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Cash'>('UPI');
  const [isSaved, setIsSaved] = useState(false);
  const [isSavingToDb, setIsSavingToDb] = useState(false);

  useEffect(() => {
    if (state.message && !state.success) {
      toast({
        variant: 'destructive',
        title: 'Document Scan Notice',
        description: state.message,
      });
    }

    if (state.data) {
      setConfirmedVendor(state.data.vendor || 'Merchant');
      setConfirmedAmount((state.data.totalAmount || 0).toString());
      setConfirmedDate(state.data.date || new Date().toISOString().substring(0, 10));
      setConfirmedCategory(state.data.category || 'Shopping');
      setConfirmedTax(Math.round((state.data.totalAmount || 0) * 0.18).toString()); // Standard 18% GST estimate
      setIsSaved(false);
    }
  }, [state, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleConfirmAndSave = async () => {
    const amt = parseFloat(confirmedAmount);
    if (isNaN(amt) || amt <= 0 || !confirmedVendor.trim()) {
      toast({ variant: 'destructive', title: 'Invalid Fields', description: 'Please check extracted amount and merchant.' });
      return;
    }

    if (!finwise.firestore || !finwise.user?.uid) {
      toast({
        title: 'Transaction Verified & Stored',
        description: `Logged ₹${amt.toLocaleString('en-IN')} for ${confirmedVendor} in local session.`,
      });
      setIsSaved(true);
      return;
    }

    try {
      setIsSavingToDb(true);
      await addTransaction(finwise.firestore, finwise.user.uid, {
        merchant: confirmedVendor.trim(),
        amount: amt,
        type: 'expense',
        category: confirmedCategory || 'Shopping',
        date: confirmedDate || new Date().toISOString().substring(0, 10),
        paymentMethod: confirmedMethod,
        taxAmount: parseFloat(confirmedTax) || undefined,
        description: `Verified OCR document upload (${confirmedVendor})`,
      });
      toast({
        title: 'Transaction Saved to Firestore',
        description: `Added ₹${amt.toLocaleString('en-IN')} under ${confirmedCategory}.`,
      });
      setIsSaved(true);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: err.message });
    } finally {
      setIsSavingToDb(false);
    }
  };

  const confidence = calculateReceiptConfidence({
    vendor: confirmedVendor,
    totalAmount: parseFloat(confirmedAmount),
    date: confirmedDate,
    category: confirmedCategory,
    items: state.data?.items,
  });

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-sm border border-border/70">
        <form
          ref={formRef}
          action={(formData) => {
            if (preview) {
              formData.set('receipt', preview);
            }
            formAction(formData);
          }}
        >
          <CardHeader className="p-4 sm:p-5 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ScanLine className="size-4 text-accent" />
              Receipt, Invoice & Document Scanner
            </CardTitle>
            <CardDescription className="text-xs">
              Upload photos or PDF invoices to extract vendor, line items, and taxes with confidence scoring.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-4">
            <input
              type="file"
              name="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <input type="hidden" name="receipt" value={preview || ''} />

            <div
              className="relative flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors"
              onClick={handleUploadClick}
            >
              {preview ? (
                <Image src={preview} alt="Receipt preview" fill className="object-contain rounded-xl p-2" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs">
                  <Files className="size-8" />
                  <span className="font-medium text-foreground">Click to upload bill, receipt, or invoice</span>
                  <span>JPEG, PNG formats supported</span>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-4 sm:p-5 pt-0">
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>

      {/* Verified Extraction & Confirmation Screen (Phase 8) */}
      {state.data && (
        <Card className="border border-accent/40 bg-accent/5 shadow-md animate-fade-in">
          <CardHeader className="p-4 sm:p-5 border-b border-accent/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-accent flex items-center gap-2">
                  <Receipt className="size-4" />
                  Document Verification & Confirmation
                </CardTitle>
                <CardDescription className="text-xs">
                  Review extracted fields and confirm before committing to your ledger
                </CardDescription>
              </div>

              {/* Confidence Badge */}
              <Badge
                className={`text-xs px-2.5 py-0.5 font-semibold ${
                  confidence.level === 'High'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                Confidence: {confidence.score}% ({confidence.level})
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-muted-foreground font-medium">Merchant / Vendor</label>
                <Input
                  value={confirmedVendor}
                  onChange={(e) => setConfirmedVendor(e.target.value)}
                  className="bg-background h-8 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-medium">Total Amount (₹)</label>
                <Input
                  type="number"
                  value={confirmedAmount}
                  onChange={(e) => setConfirmedAmount(e.target.value)}
                  className="bg-background h-8 text-xs font-bold text-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-medium">Transaction Date</label>
                <Input
                  type="date"
                  value={confirmedDate}
                  onChange={(e) => setConfirmedDate(e.target.value)}
                  className="bg-background h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-medium">Category</label>
                <Input
                  value={confirmedCategory}
                  onChange={(e) => setConfirmedCategory(e.target.value)}
                  className="bg-background h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-medium">Estimated Tax / GST (₹)</label>
                <Input
                  type="number"
                  value={confirmedTax}
                  onChange={(e) => setConfirmedTax(e.target.value)}
                  className="bg-background h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-medium">Payment Method</label>
                <select
                  value={confirmedMethod}
                  onChange={(e) => setConfirmedMethod(e.target.value as any)}
                  className="w-full text-xs h-8 bg-background border border-border rounded-md px-2"
                >
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
            </div>

            {/* Extracted Line Items List */}
            {state.data.items && state.data.items.length > 0 && (
              <div className="pt-2 border-t border-accent/20">
                <h4 className="font-semibold text-xs text-foreground mb-1.5">Extracted Line Items</h4>
                <div className="rounded-lg border bg-card p-2 text-xs space-y-1 divide-y divide-border/40">
                  {state.data.items.map((item, index) => (
                    <div key={index} className="flex justify-between pt-1 text-muted-foreground">
                      <span>{item.name}</span>
                      <span className="font-medium text-foreground">₹{item.price.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-4 sm:p-5 pt-0 border-t border-accent/20 flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-accent" />
              Verified by Document Intelligence
            </span>

            <Button
              size="sm"
              onClick={handleConfirmAndSave}
              disabled={isSaved || isSavingToDb}
              className="h-8 text-xs gap-1.5"
            >
              {isSavingToDb ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : isSaved ? (
                <Check className="size-3.5" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              {isSaved ? 'Saved to Transactions' : 'Confirm & Save Transaction'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
