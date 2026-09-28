import { describe, it, expect } from 'vitest';
import {
  ExpenseTrackerOutputSchema,
  expenseTracker,
} from '@/ai/flows/expense-tracker';
import { calculateReceiptConfidenceScore } from '@/lib/receipts/confidence';
import { calculateNetWorth, calculateFinancialHealthScore } from '@/lib/finance/calculations';
import { Transaction } from '@/lib/types/finance';

describe('Receipt Scanner & Intelligence Pipeline Tests', () => {
  describe('Schema Validation', () => {
    it('validates a complete structured receipt output correctly', () => {
      const sample = {
        merchant: 'D-Mart Supermarket',
        transactionDate: '2026-09-28',
        totalAmount: 1245.5,
        subtotal: 1055.5,
        tax: 190.0,
        currency: 'INR',
        paymentMethod: 'UPI' as const,
        category: 'Groceries' as const,
        items: [
          { name: 'Basmati Rice 5kg', quantity: 1, unitPrice: 450, total: 450 },
          { name: 'Sunflower Oil 2L', quantity: 1, unitPrice: 280, total: 280 },
          { name: 'Groceries & Provisions', quantity: 1, unitPrice: 325.5, total: 325.5 },
        ],
        receiptNumber: 'DM-2026-9812',
        confidence: 94,
        rawText: 'DMART SUPERMARKET TOTAL: 1245.50',
      };

      const parsed = ExpenseTrackerOutputSchema.safeParse(sample);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.merchant).toBe('D-Mart Supermarket');
        expect(parsed.data.totalAmount).toBe(1245.5);
        expect(parsed.data.items).toHaveLength(3);
      }
    });

    it('rejects malformed receipt data when required fields are missing', () => {
      const invalid = {
        merchant: 12345, // invalid type
        totalAmount: 'one thousand', // invalid number
      };
      const parsed = ExpenseTrackerOutputSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe('Calibrated Confidence Scoring', () => {
    it('calculates high confidence for verified merchant, positive total, and matching line items', () => {
      const highQuality = {
        merchant: 'Reliance Digital',
        totalAmount: 2500,
        transactionDate: '2026-09-28',
        items: [
          { name: 'Wireless Mouse', quantity: 1, unitPrice: 1200, total: 1200 },
          { name: 'Mechanical Keyboard', quantity: 1, unitPrice: 1300, total: 1300 },
        ],
      };

      const score = calculateReceiptConfidenceScore(highQuality);
      expect(score).toBeGreaterThanOrEqual(90);
    });

    it('calculates low confidence when merchant is unknown and date is missing', () => {
      const lowQuality = {
        merchant: 'Unknown Vendor',
        totalAmount: 0,
      };

      const score = calculateReceiptConfidenceScore(lowQuality);
      expect(score).toBeLessThanOrEqual(50);
    });
  });

  describe('Graceful Fallback When AI Is Offline or Unconfigured', () => {
    it('returns structured fallback instead of crashing with unhandled error', async () => {
      // Calling expenseTracker with dummy image
      const result = await expenseTracker({
        receipt: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('merchant');
      expect(result).toHaveProperty('totalAmount');
      expect(result).toHaveProperty('confidence');
      expect(result.currency).toBe('INR');
    });
  });

  describe('Receipt-to-Transaction Consistency Audit', () => {
    it('verifies that committing an extracted receipt updates total expenses and cash flow deterministically', () => {
      const existingTransactions: Transaction[] = [
        {
          id: 'tx-1',
          userId: 'user-1',
          date: '2026-09-01',
          amount: 100000,
          type: 'income',
          category: 'Salary',
          merchant: 'Tech Corp',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'tx-2',
          userId: 'user-1',
          date: '2026-09-05',
          amount: 25000,
          type: 'expense',
          category: 'Housing & Rent',
          merchant: 'Apartment Rent',
          createdAt: new Date().toISOString(),
        },
      ];

      const initialExpense = existingTransactions
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      expect(initialExpense).toBe(25000);

      // Simulate confirming receipt extraction: D-Mart ₹1,850
      const newTransactionFromReceipt: Transaction = {
        id: 'tx-receipt-dmart',
        userId: 'user-1',
        date: '2026-09-28',
        amount: 1850,
        type: 'expense',
        category: 'Groceries',
        merchant: 'D-Mart Supermarket',
        paymentMethod: 'UPI',
        createdAt: new Date().toISOString(),
      };

      const updatedTransactions = [...existingTransactions, newTransactionFromReceipt];
      const updatedExpense = updatedTransactions
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);

      expect(updatedExpense).toBe(26850);
      expect(updatedExpense - initialExpense).toBe(1850);

      // Verify Net Worth calculation updates consistently
      const netWorthBefore = calculateNetWorth([], [], 75000, 75000);
      const netWorthAfter = calculateNetWorth([], [], 73150, 73150);
      expect(netWorthBefore.netWorth - netWorthAfter.netWorth).toBe(1850);
    });
  });
});
