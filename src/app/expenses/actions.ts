'use server';

import {
  expenseTracker,
  ExpenseTrackerInput,
  ExpenseTrackerOutput,
  ExpenseTrackerOutputSchema,
} from '@/ai/flows/expense-tracker';
import { z } from 'zod';

const schema = z.object({
  receipt: z
    .string()
    .min(10, 'Receipt image payload is missing.')
    .refine((val) => val.startsWith('data:'), {
      message: 'Invalid image format. Expected data URI.',
    }),
});

export type FormState = {
  success: boolean;
  message: string;
  data: ExpenseTrackerOutput | null;
  needsManualEntry?: boolean;
};

export async function processReceipt(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawReceipt = formData.get('receipt') as string;

  if (!rawReceipt || typeof rawReceipt !== 'string') {
    return {
      success: false,
      message: 'Please select or capture a bill/receipt image first.',
      data: null,
    };
  }

  const validatedFields = schema.safeParse({ receipt: rawReceipt });

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.errors[0]?.message || 'Invalid receipt data format.',
      data: null,
    };
  }

  try {
    const result = await expenseTracker(validatedFields.data as ExpenseTrackerInput);

    // If Gemini was offline or image couldn't be parsed
    if (!result.merchant && (!result.totalAmount || result.totalAmount === 0)) {
      return {
        success: true,
        message: "We couldn't reliably extract details from this document. Please enter the details manually below.",
        data: result,
        needsManualEntry: true,
      };
    }

    return {
      success: true,
      message: `Receipt scanned successfully (${result.merchant || 'Vendor'}, ₹${result.totalAmount.toLocaleString('en-IN')}).`,
      data: result,
      needsManualEntry: false,
    };
  } catch (error: any) {
    console.error('Error processing receipt:', error);
    return {
      success: false,
      message: error?.message || 'We could not reliably read this receipt. Please try another image or enter manually.',
      data: null,
    };
  }
}
