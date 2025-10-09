'use client';

import { initializeFirebase } from '@/firebase';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type Auth,
} from 'firebase/auth';

// This function will be used to get the auth instance.
// It ensures that Firebase is initialized before we get the auth instance.
function getFirebaseAuth(): Auth {
  const { auth } = initializeFirebase();
  return auth;
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  const googleProvider = new GoogleAuthProvider();
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
  const auth = getFirebaseAuth();
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

export async function handleEmailSignUp(email: string, password: string): Promise<void> {
  const auth = getFirebaseAuth();
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error('Error signing up with email and password:', error);
    throw new Error(error.message || 'An unexpected error occurred during sign up.');
  }
}

export async function handleEmailSignIn(email: string, password: string): Promise<void> {
  const auth = getFirebaseAuth();
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error('Error signing in with email and password:', error);
    throw new Error(error.message || 'An unexpected error occurred during sign in.');
  }
}
