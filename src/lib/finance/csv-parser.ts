import { Transaction, TransactionType } from '@/lib/types/finance';
import { autoCategorizeTransaction } from './intelligence';

export interface CSVParseResult {
  validTransactions: Omit<Transaction, 'id' | 'userId' | 'createdAt'>[];
  errors: Array<{ rowNumber: number; rawText: string; reason: string }>;
  duplicateCount: number;
  totalParsed: number;
}

/**
 * Parses CSV text, identifies columns (Date, Description/Merchant, Amount, Debit/Credit/Type),
 * normalizes dates to YYYY-MM-DD, auto-categorizes, and performs validation.
 */
export function parseTransactionCSV(
  csvContent: string,
  existingTransactions: Transaction[] = []
): CSVParseResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      validTransactions: [],
      errors: [{ rowNumber: 1, rawText: '', reason: 'CSV is empty or missing data rows.' }],
      duplicateCount: 0,
      totalParsed: 0,
    };
  }

  // Parse header
  const headerTokens = parseCSVLine(lines[0].toLowerCase());

  // Find column indices
  let dateIndex = -1;
  let descIndex = -1;
  let amountIndex = -1;
  let typeIndex = -1;
  let debitIndex = -1;
  let creditIndex = -1;

  headerTokens.forEach((token, idx) => {
    const t = token.replace(/[^a-z0-9]/g, '');
    if (t.includes('date') || t.includes('txn') && t.includes('date')) dateIndex = idx;
    else if (t.includes('desc') || t.includes('narration') || t.includes('merchant') || t.includes('particular') || t.includes('details')) descIndex = idx;
    else if (t.includes('debit') || t.includes('dr')) debitIndex = idx;
    else if (t.includes('credit') || t.includes('cr')) creditIndex = idx;
    else if (t === 'amount' || t.includes('amount') || t.includes('value')) amountIndex = idx;
    else if (t.includes('type')) typeIndex = idx;
  });

  // Fallbacks if specific headers not recognized
  if (dateIndex === -1) dateIndex = 0;
  if (descIndex === -1) descIndex = headerTokens.length > 1 ? 1 : -1;
  if (amountIndex === -1 && debitIndex === -1 && creditIndex === -1) {
    amountIndex = headerTokens.length > 2 ? 2 : -1;
  }

  const validTransactions: Omit<Transaction, 'id' | 'userId' | 'createdAt'>[] = [];
  const errors: Array<{ rowNumber: number; rawText: string; reason: string }> = [];
  let duplicateCount = 0;

  // Build a lookup key of existing transactions to prevent duplicates
  const existingSet = new Set(
    existingTransactions.map(
      (tx) => `${tx.date}_${tx.amount.toFixed(2)}_${tx.merchant.toLowerCase().trim()}`
    )
  );

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const rowTokens = parseCSVLine(rawLine);

    if (rowTokens.length < 2) {
      continue; // Skip blank lines
    }

    try {
      const rawDate = rowTokens[dateIndex]?.trim();
      const rawDesc = descIndex >= 0 ? rowTokens[descIndex]?.trim() : 'Unknown Transaction';

      let amount = 0;
      let type: TransactionType = 'expense';

      if (debitIndex >= 0 || creditIndex >= 0) {
        const debitVal = debitIndex >= 0 ? cleanNumber(rowTokens[debitIndex]) : 0;
        const creditVal = creditIndex >= 0 ? cleanNumber(rowTokens[creditIndex]) : 0;

        if (creditVal > 0) {
          amount = creditVal;
          type = 'income';
        } else if (debitVal > 0) {
          amount = debitVal;
          type = 'expense';
        } else if (amountIndex >= 0) {
          amount = cleanNumber(rowTokens[amountIndex]);
        }
      } else if (amountIndex >= 0) {
        const parsedAmt = cleanNumber(rowTokens[amountIndex]);
        if (parsedAmt < 0) {
          amount = Math.abs(parsedAmt);
          type = 'expense';
        } else {
          amount = parsedAmt;
          if (typeIndex >= 0) {
            const rawType = rowTokens[typeIndex]?.toLowerCase();
            type = rawType?.includes('in') || rawType?.includes('cr') ? 'income' : 'expense';
          }
        }
      }

      if (isNaN(amount) || amount <= 0) {
        errors.push({
          rowNumber: i + 1,
          rawText: rawLine,
          reason: `Invalid or missing transaction amount: "${amountIndex >= 0 ? rowTokens[amountIndex] : 'N/A'}"`,
        });
        continue;
      }

      const normalizedDate = parseDateString(rawDate);
      if (!normalizedDate) {
        errors.push({
          rowNumber: i + 1,
          rawText: rawLine,
          reason: `Invalid date format: "${rawDate}". Expected YYYY-MM-DD or DD/MM/YYYY.`,
        });
        continue;
      }

      // Categorization & merchant identification
      const { category, cleanMerchant } = autoCategorizeTransaction(rawDesc);

      // Duplicate check
      const duplicateKey = `${normalizedDate}_${amount.toFixed(2)}_${cleanMerchant.toLowerCase().trim()}`;
      if (existingSet.has(duplicateKey)) {
        duplicateCount++;
        continue;
      }

      validTransactions.push({
        date: normalizedDate,
        amount,
        type,
        category,
        merchant: cleanMerchant || rawDesc || 'Transaction',
        description: rawDesc,
        paymentMethod: 'Net Banking',
      });
    } catch (err: any) {
      errors.push({
        rowNumber: i + 1,
        rawText: rawLine,
        reason: err?.message || 'Failed to parse line.',
      });
    }
  }

  return {
    validTransactions,
    errors,
    duplicateCount,
    totalParsed: lines.length - 1,
  };
}

function cleanNumber(str: string | undefined): number {
  if (!str) return 0;
  const cleaned = str.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let currentToken = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(currentToken.trim());
      currentToken = '';
    } else {
      currentToken += char;
    }
  }
  result.push(currentToken.trim());
  return result;
}

function parseDateString(rawDate: string | undefined): string | null {
  if (!rawDate) return null;
  const trimmed = rawDate.trim();

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Attempt Date parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().substring(0, 10);
  }

  return null;
}
