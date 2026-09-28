'use server';

/**
 * @fileOverview Production AI Receipt & Bill Intelligence Engine
 * Multimodal extraction with Gemini, strict schema validation, deterministic confidence scoring,
 * and graceful fallback.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ReceiptItemSchema = z.object({
  name: z.string().describe('Item description or name'),
  quantity: z.number().optional().describe('Quantity purchased'),
  unitPrice: z.number().optional().describe('Price per unit'),
  total: z.number().describe('Total price for this line item'),
});
export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;

export const ExpenseTrackerInputSchema = z.object({
  receipt: z.string().describe("A photo of a receipt as a base64 data URI: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type ExpenseTrackerInput = z.infer<typeof ExpenseTrackerInputSchema>;

export const ExpenseTrackerOutputSchema = z.object({
  merchant: z.string().describe('Store or vendor name (e.g. D-Mart, Swiggy, Uber, Amazon, Apollo Pharmacy).'),
  transactionDate: z.string().describe('Date of transaction in YYYY-MM-DD format.'),
  totalAmount: z.number().describe('Total final amount paid in numbers.'),
  subtotal: z.number().optional().describe('Subtotal before taxes and tips.'),
  tax: z.number().optional().describe('Total tax or GST/VAT amount.'),
  tip: z.number().optional().describe('Tip or gratuity if applicable.'),
  currency: z.string().default('INR').describe('Currency ISO code (INR, USD, EUR, etc).'),
  paymentMethod: z
    .enum(['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash', 'Other'])
    .default('UPI')
    .describe('Payment mode used.'),
  category: z
    .enum([
      'Groceries',
      'Food & Dining',
      'Transport',
      'Housing & Rent',
      'Utilities',
      'Shopping',
      'Healthcare',
      'Entertainment',
      'Education',
      'Debt & EMI',
      'Personal Care',
      'Subscriptions',
      'Other',
    ])
    .default('Shopping')
    .describe('Most accurate financial category.'),
  items: z.array(ReceiptItemSchema).default([]).describe('Individual purchased line items.'),
  receiptNumber: z.string().optional().describe('Invoice / bill / order number if visible.'),
  confidence: z.number().min(0).max(100).default(85).describe('Extraction confidence percentage 0-100.'),
  rawText: z.string().optional().describe('OCR text extracted from document.'),
});
export type ExpenseTrackerOutput = z.infer<typeof ExpenseTrackerOutputSchema>;

import { calculateReceiptConfidenceScore } from '@/lib/receipts/confidence';


/**
 * Main Genkit Prompt Definition
 */
const receiptPrompt = ai.definePrompt({
  name: 'receiptExtractorPromptV2',
  input: { schema: ExpenseTrackerInputSchema },
  output: { schema: ExpenseTrackerOutputSchema },
  prompt: `You are FinWise AI's expert Multimodal OCR and Financial Document Intelligence Agent.
Your job is to examine the provided receipt, bill, or invoice image and extract structured financial fields.

CRITICAL EXTRACTION RULES:
1. **Merchant / Vendor**: Look at the header or logo for the business name (e.g. Swiggy, Zomato, D-Mart, Reliance Fresh, Starbucks, Uber, Shell, Apollo Pharmacy, Apple, Amazon).
2. **Transaction Date**: Find the date printed on the receipt. ALWAYS convert it to ISO format: YYYY-MM-DD. If year is 2-digit, map to 20XX.
3. **Total Amount**: The final grand total / amount paid. Look for "Grand Total", "Total Amount", "Net Amount", "Amount Paid", "Total (INR)", or "₹". Must be a positive number.
4. **Subtotal & Tax**: If taxes (GST, CGST, SGST, VAT) are broken down, extract tax and subtotal.
5. **Payment Method**: Identify if UPI (GPay, PhonePe, Paytm, QR code), Credit Card, Debit Card, Net Banking, or Cash. Default to UPI if in India and unspecified.
6. **Category**: Classify into one of: 'Groceries', 'Food & Dining', 'Transport', 'Housing & Rent', 'Utilities', 'Shopping', 'Healthcare', 'Entertainment', 'Education', 'Debt & EMI', 'Personal Care', 'Subscriptions', 'Other'.
7. **Line Items**: List each individual item with its name, quantity, unit price, and total amount.
8. If the image is completely unreadable or does not contain a financial receipt/bill, extract whatever minimal clues exist with low confidence score.

Receipt Image: {{media url=receipt}}`,
  model: googleAI.model('gemini-1.5-flash'),
});

/**
 * Execute AI extraction with graceful fallback if Gemini key is missing or quota is exceeded
 */
export async function expenseTracker(input: ExpenseTrackerInput): Promise<ExpenseTrackerOutput> {
  const hasGeminiKey = Boolean(
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GOOGLE_API_KEY
  );

  if (hasGeminiKey) {
    try {
      const response = await receiptPrompt(input);
      if (response.output) {
        const validated = ExpenseTrackerOutputSchema.parse(response.output);
        const calibratedConfidence = calculateReceiptConfidenceScore(validated);
        return {
          ...validated,
          confidence: calibratedConfidence,
        };
      }
    } catch (err: any) {
      console.warn('Gemini Receipt Extraction API error, evaluating fallback:', err?.message || err);
    }
  } else {
    console.warn('No Gemini API key detected (GEMINI_API_KEY). Running structured fallback engine.');
  }

  // Graceful deterministic parsing:
  // If the image cannot be processed by the LLM (offline or key missing),
  // return a structured template that prompts manual review rather than failing with an unhandled exception.
  const currentDate = new Date().toISOString().substring(0, 10);
  return {
    merchant: '',
    transactionDate: currentDate,
    totalAmount: 0,
    subtotal: 0,
    tax: 0,
    currency: 'INR',
    paymentMethod: 'UPI',
    category: 'Shopping',
    items: [],
    confidence: 35,
    rawText: 'AI API unavailable or unconfigured. Please review and input values manually.',
  };
}
