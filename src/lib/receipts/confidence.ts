/**
 * Deterministically compute confidence score for extracted receipt data
 */
export function calculateReceiptConfidenceScore(extracted: {
  merchant?: string;
  totalAmount?: number;
  transactionDate?: string;
  items?: Array<{ name: string; quantity?: number; unitPrice?: number; total: number }>;
}): number {
  let score = 30; // base score for getting an AI response

  if (extracted.merchant && extracted.merchant !== 'Unknown Vendor' && extracted.merchant.length > 2) {
    score += 25;
  }
  if (extracted.totalAmount && extracted.totalAmount > 0) {
    score += 20;
  }
  if (extracted.transactionDate && /^\d{4}-\d{2}-\d{2}$/.test(extracted.transactionDate)) {
    score += 10;
  }
  if (extracted.items && extracted.items.length > 0) {
    const itemsSum = extracted.items.reduce((sum, item) => sum + (item.total || 0), 0);
    // If line items approximately sum to total (within 15% for tax/rounding)
    if (extracted.totalAmount && Math.abs(itemsSum - extracted.totalAmount) <= (extracted.totalAmount * 0.15)) {
      score += 15;
    } else {
      score += 5;
    }
  }

  return Math.min(99, Math.max(20, score));
}
