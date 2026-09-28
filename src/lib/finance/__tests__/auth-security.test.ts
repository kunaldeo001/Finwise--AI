import { describe, it, expect, vi } from 'vitest';
import {
  evaluatePasswordStrength,
  formatAuthError,
} from '@/firebase/auth/auth-service';
import { collections } from '@/lib/finance/firestore-service';

// Mock collection function from firebase/firestore
vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn((_firestore, ...pathSegments) => ({
      type: 'collection',
      path: pathSegments.join('/'),
    })),
    doc: vi.fn((_firestore, ...pathSegments) => ({
      type: 'doc',
      path: pathSegments.join('/'),
    })),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    writeBatch: vi.fn(() => ({
      set: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn(),
    })),
  };
});

describe('Production Authentication & Security Tests', () => {
  describe('Password Strength Engine', () => {
    it('evaluates weak passwords properly', () => {
      const weak = evaluatePasswordStrength('123');
      expect(weak.score).toBe(0);
      expect(weak.hasMinLength).toBe(false);
      expect(weak.label).toBe('Very Weak');
    });

    it('evaluates moderate passwords with length and letters', () => {
      const fair = evaluatePasswordStrength('Pass1234');
      expect(fair.hasMinLength).toBe(true);
      expect(fair.hasUppercase).toBe(true);
      expect(fair.hasLowercase).toBe(true);
      expect(fair.hasNumber).toBe(true);
      expect(fair.score).toBeGreaterThanOrEqual(3);
    });

    it('identifies strong passwords with symbols, mixed case and numbers', () => {
      const strong = evaluatePasswordStrength('F!nWise#2026$Safe');
      expect(strong.score).toBe(4);
      expect(strong.label).toBe('Very Strong');
      expect(strong.hasSpecialChar).toBe(true);
      expect(strong.hasMinLength).toBe(true);
    });
  });

  describe('Auth Error Formatting (User-Friendly Messages)', () => {
    it('translates auth/invalid-credential to actionable advice', () => {
      const msg = formatAuthError({ code: 'auth/invalid-credential' });
      expect(msg).toContain('Incorrect email or password');
    });

    it('translates auth/email-already-in-use to helpful prompt', () => {
      const msg = formatAuthError({ code: 'auth/email-already-in-use' });
      expect(msg).toContain('An account already exists');
    });

    it('translates auth/weak-password clearly', () => {
      const msg = formatAuthError({ code: 'auth/weak-password' });
      expect(msg).toContain('at least 6 characters');
    });

    it('handles unexpected errors without crashing', () => {
      const msg = formatAuthError(new Error('Unknown network timeout'));
      expect(msg).toBe('Unknown network timeout');
    });
  });

  describe('Firestore Multi-Tenant User Isolation', () => {
    it('scopes all collections strictly by authenticated user UID', () => {
      const mockFirestore = {} as any;
      const userA = 'user-alpha-123';
      const userB = 'user-bravo-456';

      const colTxA = collections.transactions(mockFirestore, userA) as any;
      const colTxB = collections.transactions(mockFirestore, userB) as any;
      expect(colTxA.path).toBe(`users/${userA}/transactions`);
      expect(colTxB.path).toBe(`users/${userB}/transactions`);

      const colReceiptsA = collections.receipts(mockFirestore, userA) as any;
      const colReceiptsB = collections.receipts(mockFirestore, userB) as any;
      expect(colReceiptsA.path).toBe(`users/${userA}/receipts`);
      expect(colReceiptsB.path).toBe(`users/${userB}/receipts`);
    });

    it('never permits cross-user record contamination in collections object', () => {
      const mockFirestore = {} as any;
      const targetUser = 'isolated-uid-999';

      const paths = [
        collections.transactions(mockFirestore, targetUser),
        collections.budgets(mockFirestore, targetUser),
        collections.goals(mockFirestore, targetUser),
        collections.investments(mockFirestore, targetUser),
        collections.debts(mockFirestore, targetUser),
        collections.alerts(mockFirestore, targetUser),
        collections.reports(mockFirestore, targetUser),
        collections.receipts(mockFirestore, targetUser),
        collections.subscriptions(mockFirestore, targetUser),
        collections.audit(mockFirestore, targetUser),
      ];

      paths.forEach((colRef: any) => {
        expect(colRef.path).toContain(`users/${targetUser}`);
      });
    });
  });
});
