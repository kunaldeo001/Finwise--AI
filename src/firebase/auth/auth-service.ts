'use client';

import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  deleteUser,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { deleteUserAllData } from '@/lib/finance/firestore-service';

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  color: string;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (password.length >= 6) score++;
  if (hasMinLength && (hasUppercase || hasLowercase)) score++;
  if (hasNumber && (hasUppercase || hasLowercase)) score++;
  if (hasMinLength && hasNumber && hasSpecialChar) score++;

  const labels: PasswordStrength['label'][] = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-emerald-400',
  ];

  return {
    score,
    label: labels[score] || 'Weak',
    color: colors[score] || 'bg-red-500',
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
  };
}

export function formatAuthError(error: any): string {
  if (!error) return 'An unexpected error occurred.';
  const code = error.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please provide a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please check or create an account.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/requires-recent-login':
      return 'This sensitive operation requires recent authentication. Please sign in again.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed login attempts. Try again later or reset password.';
    case 'auth/popup-closed-by-user':
      return 'Sign in was cancelled (popup closed).';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for authentication.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please verify your internet connection.';
    default:
      return error.message || 'Authentication request failed.';
  }
}

export async function signUpWithEmail(
  auth: Auth,
  email: string,
  pass: string,
  displayName?: string
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (displayName?.trim() && credential.user) {
    try {
      await updateProfile(credential.user, { displayName: displayName.trim() });
    } catch (err) {
      console.warn('Failed to set initial displayName:', err);
    }
  }
  return credential.user;
}

export async function signInWithEmail(auth: Auth, email: string, pass: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return credential.user;
}

export async function signInWithGoogle(auth: Auth): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(auth, provider);
  return credential.user;
}

export async function resetPassword(auth: Auth, email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logOut(auth: Auth): Promise<void> {
  await signOut(auth);
}

export async function changeUserPassword(user: User, newPass: string): Promise<void> {
  await updatePassword(user, newPass);
}

export async function deleteUserAccount(user: User, firestore?: Firestore | null): Promise<void> {
  const uid = user.uid;
  if (firestore) {
    try {
      await deleteUserAllData(firestore, uid);
    } catch (err) {
      console.warn('Could not clean all firestore data prior to user deletion:', err);
    }
  }
  await deleteUser(user);
}
