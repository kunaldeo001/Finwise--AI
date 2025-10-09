
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
import { Label } from '@/components/ui/label';
import { Loader2, ScanLine, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const initialState = {
  success: false,
  message: '',
  data: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ScanLine className="mr-2 h-4 w-4" />
      )}
      Scan Bill
    </Button>
  );
}

export function ScanBill() {
  const [state, formAction] = useActionState(processReceipt, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (state.message && !state.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
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

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <form
          ref={formRef}
          action={(formData) => {
            if (preview) {
              formData.set('receipt', preview);
            }
            formAction(formData);
          }}
        >
          <CardHeader>
            <CardTitle>Scan a Bill</CardTitle>
            <CardDescription>
              Upload an image of your receipt to automatically track your expenses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                className="relative flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/40"
                onClick={handleUploadClick}
              >
                {preview ? (
                  <Image src={preview} alt="Receipt preview" fill className="object-contain rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="size-8" />
                    <span>Click to upload a bill</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
      
      {state.data && (
        <Card className="bg-primary/5 border-primary/20 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-primary">Expense Extracted</CardTitle>
            <CardDescription>
              AI has processed your receipt from {state.data.vendor}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
             <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Vendor</span>
              <span className="font-semibold">{state.data.vendor}</span>
            </div>
             <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Date</span>
              <span className="font-semibold">{state.data.date}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="font-semibold">₹{state.data.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Category</span>
              <span className="font-semibold">{state.data.category}</span>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Items Purchased</h4>
              <ul className="space-y-1 text-muted-foreground list-disc pl-5">
                {state.data.items.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{item.name}</span>
                    <span>₹{item.price.toLocaleString('en-IN')}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
