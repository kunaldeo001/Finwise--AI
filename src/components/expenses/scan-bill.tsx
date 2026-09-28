'use client';

import { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import { processReceipt } from '@/app/expenses/actions';
import { preprocessReceiptFile, PreprocessedImageResult } from '@/lib/receipts/image-preprocessor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2,
  ScanLine,
  Upload,
  Camera,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Plus,
  RefreshCw,
  FileText,
  DollarSign,
  ArrowRight,
  Sparkles,
  Edit2,
  Check,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { addTransaction, addReceipt } from '@/lib/finance/firestore-service';
import { ExtractedReceiptItem } from '@/lib/types/finance';

interface ScanBillProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type ScanStep = 'SELECT' | 'PREPROCESSING' | 'EXTRACTING' | 'VALIDATING' | 'REVIEW' | 'SAVED' | 'MANUAL';

export function ScanBill({ onSuccess, onCancel }: ScanBillProps) {
  const { toast } = useToast();
  const finwise = useFinwiseData();
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ScanStep>('SELECT');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [preprocessed, setPreprocessed] = useState<PreprocessedImageResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Review & Editable Fields
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Cash' | 'Other'>('UPI');
  const [tax, setTax] = useState('');
  const [notes, setNotes] = useState('');
  const [confidence, setConfidence] = useState(85);
  const [items, setItems] = useState<ExtractedReceiptItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Handle file chosen from upload or camera
  const handleFileChosen = async (file: File) => {
    try {
      setErrorMessage(null);
      setStep('PREPROCESSING');
      setStatusMessage('Optimizing & compressing image for AI OCR...');

      const result = await preprocessReceiptFile(file);
      setPreprocessed(result);

      // Now send to Server Action
      setStep('EXTRACTING');
      setStatusMessage('Analyzing document with Multimodal AI...');

      const formData = new FormData();
      formData.set('receipt', result.dataUri);

      startTransition(async () => {
        try {
          setStep('VALIDATING');
          setStatusMessage('Validating extracted fields against financial schema...');

          const res = await processReceipt({ success: false, message: '', data: null }, formData);

          if (!res.success) {
            setErrorMessage(res.message);
            setStep('SELECT');
            return;
          }

          if (res.data) {
            setMerchant(res.data.merchant || '');
            setAmount(res.data.totalAmount ? res.data.totalAmount.toString() : '');
            setDate(res.data.transactionDate || new Date().toISOString().substring(0, 10));
            setCategory(res.data.category || 'Shopping');
            setPaymentMethod(res.data.paymentMethod || 'UPI');
            setTax(res.data.tax ? res.data.tax.toString() : '');
            setConfidence(res.data.confidence || 75);
            setItems(res.data.items || []);
            setNotes(res.data.receiptNumber ? `Invoice #${res.data.receiptNumber}` : '');

            setStep('REVIEW');
            toast({
              title: res.needsManualEntry ? 'Ready for Input' : 'Receipt Successfully Scanned',
              description: res.message,
            });
          }
        } catch (err: any) {
          setErrorMessage(err?.message || 'Server extraction error. Please try again.');
          setStep('SELECT');
        }
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not process file.');
      setStep('SELECT');
    }
  };

  const handleAddItem = () => {
    setItems([...items, { name: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const handleUpdateItem = (index: number, field: keyof ExtractedReceiptItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = updated[index].quantity || 1;
      const p = updated[index].unitPrice || 0;
      updated[index].total = q * p;
    }
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleSwitchToManual = () => {
    setMerchant('');
    setAmount('');
    setDate(new Date().toISOString().substring(0, 10));
    setCategory('Shopping');
    setPaymentMethod('UPI');
    setTax('');
    setNotes('Manually recorded transaction');
    setConfidence(100);
    setItems([]);
    setStep('REVIEW');
  };

  const handleSaveTransaction = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please specify a valid transaction amount greater than ₹0.',
      });
      return;
    }

    if (!merchant.trim()) {
      toast({
        variant: 'destructive',
        title: 'Vendor Required',
        description: 'Please specify the vendor or merchant name.',
      });
      return;
    }

    try {
      setIsSaving(true);
      const parsedTax = parseFloat(tax);

      if (finwise.isAuthenticated && finwise.firestore && finwise.user?.uid) {
        // 1. Create Receipt document
        const receiptDoc = await addReceipt(finwise.firestore, finwise.user.uid, {
          merchant: merchant.trim(),
          transactionDate: date || new Date().toISOString().substring(0, 10),
          totalAmount: parsedAmount,
          tax: !isNaN(parsedTax) ? parsedTax : undefined,
          currency: 'INR',
          paymentMethod,
          category,
          items,
          confidence,
          status: 'PROCESSED',
          notes: notes.trim() || undefined,
        });

        // 2. Create Transaction linked to receipt
        await addTransaction(finwise.firestore, finwise.user.uid, {
          merchant: merchant.trim(),
          amount: parsedAmount,
          type: 'expense',
          category,
          date: date || new Date().toISOString().substring(0, 10),
          paymentMethod,
          taxAmount: !isNaN(parsedTax) ? parsedTax : undefined,
          description: notes.trim() || `Verified receipt extraction (${merchant.trim()})`,
        });

        toast({
          title: 'Transaction Saved to Firestore',
          description: `Logged ₹${parsedAmount.toLocaleString('en-IN')} for ${merchant.trim()} under ${category}.`,
        });
      } else {
        // Demo Mode / Sandboxed Save
        finwise.addDemoReceipt({
          merchant: merchant.trim(),
          transactionDate: date || new Date().toISOString().substring(0, 10),
          totalAmount: parsedAmount,
          tax: !isNaN(parsedTax) ? parsedTax : undefined,
          currency: 'INR',
          paymentMethod,
          category,
          items,
          confidence,
          status: 'PROCESSED',
          notes: notes.trim() || undefined,
        });

        finwise.addDemoTransaction({
          merchant: merchant.trim(),
          amount: parsedAmount,
          type: 'expense',
          category,
          date: date || new Date().toISOString().substring(0, 10),
          paymentMethod,
          taxAmount: !isNaN(parsedTax) ? parsedTax : undefined,
          description: notes.trim() || `Demo verified scan (${merchant.trim()})`,
        });

        toast({
          title: 'Simulated in Demo Mode',
          description: `Logged ₹${parsedAmount.toLocaleString('en-IN')} for ${merchant.trim()} in local session.`,
        });
      }

      setStep('SAVED');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: err.message || 'Could not commit transaction to ledger.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileChosen(file);
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileChosen(file);
        }}
      />

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive-foreground">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-destructive" />
            <span>{errorMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSwitchToManual}
            className="h-6 text-[11px] underline text-destructive-foreground hover:text-foreground"
          >
            Enter Manually
          </Button>
        </div>
      )}

      {/* STEP 1: SELECT / UPLOAD / DRAG & DROP */}
      {step === 'SELECT' && (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileChosen(file);
            }}
            className="relative flex h-52 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-muted/20 hover:border-emerald-500/50 hover:bg-muted/40 transition-all p-4 text-center group"
          >
            <div className="size-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-105 transition-transform">
              <Upload className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Click or drag & drop to upload bill or receipt
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports JPEG, PNG, WEBP, HEIC, and PDF (up to 12MB)
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Automatic GST & Tax OCR
              </Badge>
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                Multimodal AI Extraction
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="h-9 text-xs gap-1.5"
            >
              <Upload className="size-3.5" />
              Upload Document
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              className="h-9 text-xs gap-1.5"
            >
              <Camera className="size-3.5" />
              Take Photo
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleSwitchToManual}
              className="col-span-2 sm:col-span-1 h-9 text-xs gap-1.5 border border-border"
            >
              <FileText className="size-3.5" />
              Enter Manually
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: PROCESSING / EXTRACTING SPINNER */}
      {(step === 'PREPROCESSING' || step === 'EXTRACTING' || step === 'VALIDATING') && (
        <Card className="border border-border/80 bg-card/60 p-6 text-center space-y-4">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative size-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Loader2 className="size-6 animate-spin text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">
                {step === 'PREPROCESSING' && 'Compressing Document...'}
                {step === 'EXTRACTING' && 'AI Multimodal Extraction...'}
                {step === 'VALIDATING' && 'Verifying Financial Fields...'}
              </h4>
              <p className="text-xs text-muted-foreground">{statusMessage}</p>
            </div>
          </div>

          {preprocessed?.dataUri && (
            <div className="relative h-32 w-full max-w-xs mx-auto rounded-lg overflow-hidden border border-border/80 bg-black/40">
              <Image
                src={preprocessed.dataUri}
                alt="Document preview"
                fill
                className="object-contain p-1 opacity-80"
              />
            </div>
          )}

          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSwitchToManual}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Skip AI & Enter Manually
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: INTERACTIVE RECEIPT REVIEW SCREEN */}
      {step === 'REVIEW' && (
        <div className="space-y-4 animate-fade-in">
          {/* Review Header Banner */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Receipt className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  Receipt Scanned Successfully
                </h4>
                <p className="text-xs text-muted-foreground">
                  Review extracted data below before committing to your ledger.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                className={`text-xs px-2.5 py-0.5 font-bold ${
                  confidence >= 80
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : confidence >= 60
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}
              >
                Confidence: {confidence}%
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('SELECT')}
                className="h-7 text-xs gap-1"
                title="Scan another image"
              >
                <RefreshCw className="size-3" /> Re-scan
              </Button>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-card p-4 rounded-xl border border-border/80">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs font-medium">Merchant / Vendor Name</Label>
              <Input
                placeholder="e.g. D-Mart, Swiggy, Uber, Starbucks"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="h-9 text-xs font-semibold"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Total Amount (₹)</Label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9 text-xs font-bold text-emerald-400"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Transaction Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Groceries">Groceries</SelectItem>
                  <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                  <SelectItem value="Housing & Rent">Housing & Rent</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Shopping">Shopping</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Debt & EMI">Debt & EMI</SelectItem>
                  <SelectItem value="Subscriptions">Subscriptions</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">UPI (GPay / PhonePe / Paytm)</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Debit Card">Debit Card</SelectItem>
                  <SelectItem value="Net Banking">Net Banking</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs font-medium">Tax / GST (₹) (Optional)</Label>
              <Input
                type="number"
                step="any"
                placeholder="Included or optional tax amount"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-2 bg-card p-4 rounded-xl border border-border/80">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Extracted Line Items ({items.length})</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddItem}
                className="h-6 text-[11px] gap-1 text-emerald-400 hover:text-emerald-300"
              >
                <Plus className="size-3" /> Add Item
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-1">
                No individual line items parsed. Total amount will be recorded directly.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                      className="h-8 text-xs flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity || 1}
                      onChange={(e) => handleUpdateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                      className="h-8 text-xs w-16"
                    />
                    <Input
                      type="number"
                      step="any"
                      placeholder="Total"
                      value={item.total}
                      onChange={(e) => handleUpdateItem(idx, 'total', parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs w-24 font-mono font-medium text-emerald-400"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(idx)}
                      className="size-7 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel} className="h-9 text-xs">
                Cancel
              </Button>
            )}
            <Button
              type="button"
              disabled={isSaving}
              onClick={handleSaveTransaction}
              className="h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-sm px-5"
            >
              {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Add Transaction
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: SAVED CONFIRMATION */}
      {step === 'SAVED' && (
        <div className="p-6 text-center space-y-3 bg-card rounded-xl border border-emerald-500/30">
          <div className="size-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-6" />
          </div>
          <h4 className="text-base font-bold text-foreground">Transaction Logged Successfully</h4>
          <p className="text-xs text-muted-foreground">
            The receipt has been archived and added to your ledger, budgets, and cash flow forecast.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPreprocessed(null);
                setStep('SELECT');
              }}
              className="h-8 text-xs"
            >
              Scan Another Receipt
            </Button>
            {onSuccess && (
              <Button size="sm" onClick={onSuccess} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500">
                Done
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
