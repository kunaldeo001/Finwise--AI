'use client';

import { initializeFirebase } from '@/firebase';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

const { auth } = initializeFirebase();
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error('Error signing in with Google:', error);
    const params = new URLSearchParams({
      error: 'Failed to sign in with Google. Please try again.',
    });
    window.location.search = params.toString();
  }
}

export async function handleSignOut() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

export async function handleEmailSignUp(email: string, password: string): Promise<void> {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error('Error signing up with email and password:', error);
    throw new Error(error.message || 'An unexpected error occurred during sign up.');
  }
}

export async function handleEmailSignIn(email: string, password: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error('Error signing in with email and password:', error);
    throw new Error(error.message || 'An unexpected error occurred during sign in.');
  }
}
