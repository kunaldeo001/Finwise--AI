
'use server';

import {
  expenseTracker,
  ExpenseTrackerInput,
  ExpenseTrackerOutput,
} from '@/ai/flows/expense-tracker';
import { z } from 'zod';

const schema = z.object({
  receipt: z.string().min(1, 'Receipt image is required.'),
});

export type FormState = {
  success: boolean;
  message: string;
  data: ExpenseTrackerOutput | null;
};

export async function processReceipt(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data. Please upload a receipt.',
      data: null,
    };
  }

  try {
    const result = await expenseTracker(validatedFields.data as ExpenseTrackerInput);
    return {
      success: true,
      message: 'Receipt processed successfully.',
      data: result,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Failed to process receipt with AI. Please try again.',
      data: null,
    };
  }
}
