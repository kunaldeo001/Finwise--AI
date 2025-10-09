
'use server';

/**
 * @fileOverview An expense tracker AI agent.
 *
 * - expenseTracker - A function that handles the expense tracking process.
 * - ExpenseTrackerInput - The input type for the expenseTracker function.
 * - ExpenseTrackerOutput - The return type for the expenseTracker function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const ExpenseTrackerInputSchema = z.object({
  receipt: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExpenseTrackerInput = z.infer<typeof ExpenseTrackerInputSchema>;

const ExpenseTrackerOutputSchema = z.object({
  vendor: z.string().describe('The name of the vendor or store.'),
  date: z.string().describe('The date of the transaction in YYYY-MM-DD format.'),
  totalAmount: z.number().describe('The total amount of the transaction.'),
  items: z.array(z.object({
    name: z.string().describe('The name of the item.'),
    price: z.number().describe('The price of the item.'),
  })).describe('A list of items purchased.'),
  category: z.enum(['Groceries', 'Dining', 'Transport', 'Shopping', 'Utilities', 'Other']).describe('The category of the expense.'),
});
export type ExpenseTrackerOutput = z.infer<typeof ExpenseTrackerOutputSchema>;

export async function expenseTracker(input: ExpenseTrackerInput): Promise<ExpenseTrackerOutput> {
  return expenseTrackerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'expenseTrackerPrompt',
  input: { schema: ExpenseTrackerInputSchema },
  output: { schema: ExpenseTrackerOutputSchema },
  prompt: `You are an expert receipt processing agent. Your task is to accurately extract information from the provided receipt image.

Analyze the image and extract the following details:
1.  **Vendor Name**: Identify the name of the store or business.
2.  **Transaction Date**: Find the date of the purchase and format it as YYYY-MM-DD.
3.  **Total Amount**: Extract the final total amount paid.
4.  **Line Items**: List each item purchased along with its price.
5.  **Category**: Based on the vendor and items, classify the expense into one of these categories: Groceries, Dining, Transport, Shopping, Utilities, Other.

Return the extracted information in the exact JSON format specified by the output schema.

Receipt Image: {{media url=receipt}}`,
  model: googleAI.model('gemini-1.5-flash-latest'),
});

const expenseTrackerFlow = ai.defineFlow(
  {
    name: 'expenseTrackerFlow',
    inputSchema: ExpenseTrackerInputSchema,
    outputSchema: ExpenseTrackerOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
