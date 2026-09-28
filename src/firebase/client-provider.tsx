'use client';

import React, { useMemo, useState, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [initError, setInitError] = useState<string | null>(null);

  const firebaseServices = useMemo(() => {
    try {
      return initializeFirebase();
    } catch (err: any) {
      console.warn('Firebase initialization notice:', err?.message || err);
      setInitError('Authentication service is temporarily unavailable.');
      return null;
    }
  }, []);

  if (initError || !firebaseServices) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="max-w-md w-full rounded-2xl border border-border/80 bg-card p-6 text-center space-y-4 shadow-xl">
          <div className="size-12 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="text-lg font-bold">Authentication Service Notice</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Authentication service is temporarily unavailable.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className="size-3.5" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}