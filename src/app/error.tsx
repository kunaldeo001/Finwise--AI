'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('FinWise AI Root Segment Error:', error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card/90 p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl space-y-6">
        <div className="size-14 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive mx-auto shadow-inner">
          <AlertOctagon className="size-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Something went wrong</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            An unexpected error occurred while rendering this interface. Your data is isolated and safely preserved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto h-9 px-5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-md shadow-emerald-950/40"
          >
            <RefreshCw className="size-3.5" />
            Try Again
          </Button>

          <Button
            variant="outline"
            asChild
            className="w-full sm:w-auto h-9 px-5 text-xs font-semibold border-border/80 gap-2"
          >
            <Link href="/">
              <Home className="size-3.5 text-muted-foreground" />
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
