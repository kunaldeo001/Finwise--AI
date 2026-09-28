'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('FinWise AI Global Unhandled Error:', error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b0f17] text-zinc-100 flex items-center justify-center p-4 font-sans antialiased">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl space-y-6">
          <div className="size-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-inner">
            <AlertOctagon className="size-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Something went wrong</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              An unexpected system anomaly occurred while loading this view. Your financial records and workspace remain secure.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-9 px-5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-950/40"
            >
              <RefreshCw className="size-3.5" />
              Try Again
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-9 px-5 rounded-lg text-xs font-semibold border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 transition-all"
            >
              <Home className="size-3.5 text-zinc-400" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
