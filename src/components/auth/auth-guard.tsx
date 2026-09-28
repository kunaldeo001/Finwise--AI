'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { useDemoMode } from '@/context/demo-mode-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Sparkles,
  Receipt,
  TrendingUp,
  LineChart,
  Lock,
  Wallet,
  ArrowRight,
  CheckCircle2,
  ScanLine,
  Target,
  BarChart3,
} from 'lucide-react';
import { AuthDialog } from '@/components/auth/auth-dialog';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isUserLoading } = useUser();
  const { isDemoMode, enableDemoMode, isInitialized } = useDemoMode();

  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');

  // If Firebase Auth is still resolving its initial state or demo mode is initializing, show skeleton
  if (isUserLoading || !isInitialized) {
    return (
      <div className="flex h-[75vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
            <ShieldCheck className="size-5" />
          </div>
          <p className="text-xs text-muted-foreground animate-pulse">Securing workspace session...</p>
        </div>
      </div>
    );
  }

  // Access is granted if authenticated OR in explicit demo mode
  const isAuthenticated = Boolean(user && !user.isAnonymous);
  if (isAuthenticated || isDemoMode) {
    return <>{children}</>;
  }

  // Otherwise, render the polished Landing / Authentication screen
  const handleOpenAuth = (tab: 'signin' | 'signup') => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl space-y-10 text-center">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
          <Sparkles className="size-3.5" />
          <span>FinWise AI 2.0 • Autonomous Financial Intelligence</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Your finances belong to you.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
              Private, isolated & AI-powered.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Sign in to access your private financial workspace, or explore all intelligence tools instantly with sandboxed demo data.
          </p>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            size="lg"
            onClick={() => handleOpenAuth('signup')}
            className="w-full sm:w-auto h-11 px-7 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 gap-2"
          >
            Create Free Account <ArrowRight className="size-4" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => handleOpenAuth('signin')}
            className="w-full sm:w-auto h-11 px-7 text-sm font-semibold border-border/80 gap-2"
          >
            <Lock className="size-4 text-muted-foreground" /> Sign In
          </Button>

          <Button
            size="lg"
            variant="secondary"
            onClick={enableDemoMode}
            className="w-full sm:w-auto h-11 px-7 text-sm font-semibold border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 gap-2"
          >
            <Sparkles className="size-4" /> Try Demo
          </Button>
        </div>

        {/* Value Prop Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 text-left">
          <div className="rounded-xl border border-border/80 bg-card/60 p-5 backdrop-blur-sm space-y-2">
            <div className="size-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ScanLine className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">AI Receipt & Bill Scanner</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload photos or invoices. Multimodal OCR extracts merchant, amount, category, and line items with verification review.
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 p-5 backdrop-blur-sm space-y-2">
            <div className="size-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <TrendingUp className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Deterministic Financial Engine</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No hallucinated numbers. Verified math for cash flow runway, emergency buffers, debt amortization, and net worth tracking.
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 p-5 backdrop-blur-sm space-y-2">
            <div className="size-8 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center">
              <ShieldCheck className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Complete Data Isolation</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every user&apos;s documents are isolated to their Firebase UID. Demo data never touches real user ledgers.
            </p>
          </div>
        </div>

        {/* Feature Checkmarks */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground pt-4">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-400" />
            <span>5-Pillar Health Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-400" />
            <span>90-Day Cash Flow Forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-400" />
            <span>Debt Optimization & EMI Calculator</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-400" />
            <span>Automated Subscription Audits</span>
          </div>
        </div>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab={authTab} />
    </div>
  );
}
