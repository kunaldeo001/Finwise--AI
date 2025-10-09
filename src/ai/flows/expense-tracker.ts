
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
import {googleAI} from '@genkit-ai/googleai';

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
  prompt: `You are an expert receipt processing agent. Extract the vendor, date, total amount, and line items from the provided receipt image. Also, categorize the expense based on the items.

Receipt: {{media url=receipt}}`,
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
