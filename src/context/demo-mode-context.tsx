'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@/firebase';

interface DemoModeContextType {
  isDemoMode: boolean;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  isInitialized: boolean;
}

const DemoModeContext = createContext<DemoModeContextType>({
  isDemoMode: false,
  enableDemoMode: () => {},
  disableDemoMode: () => {},
  isInitialized: false,
});

const DEMO_STORAGE_KEY = 'finwise_demo_mode_active';

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    // If real user is logged in, demo mode is always inactive
    if (user && !user.isAnonymous) {
      setIsDemoMode(false);
      try {
        localStorage.removeItem(DEMO_STORAGE_KEY);
      } catch {}
      setIsInitialized(true);
      return;
    }

    try {
      const stored = localStorage.getItem(DEMO_STORAGE_KEY);
      if (stored === 'true') {
        setIsDemoMode(true);
      } else {
        setIsDemoMode(false);
      }
    } catch {
      setIsDemoMode(false);
    }
    setIsInitialized(true);
  }, [user]);

  const enableDemoMode = () => {
    setIsDemoMode(true);
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, 'true');
    } catch {}
  };

  const disableDemoMode = () => {
    setIsDemoMode(false);
    try {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    } catch {}
  };

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode: Boolean(!user && isDemoMode),
        enableDemoMode,
        disableDemoMode,
        isInitialized,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
