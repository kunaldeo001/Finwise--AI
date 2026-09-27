'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NetWorthCardProps {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetDistribution: Record<string, number>;
  liabilityDistribution: Record<string, number>;
}

export function NetWorthCard({
  totalAssets,
  totalLiabilities,
  netWorth,
  assetDistribution,
  liabilityDistribution,
}: NetWorthCardProps) {
  return (
    <Card className="relative overflow-hidden border border-border/70 hover:border-emerald-500/30 transition-all duration-200 shadow-sm">
      <div className="h-0.5 w-full bg-emerald-500/60" />
      <CardHeader className="pb-3 border-b bg-muted/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Landmark className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Net Worth Overview</CardTitle>
              <CardDescription className="text-xs">
                Total Assets minus Outstanding Liabilities
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={netWorth >= 0 ? "success" : "destructive"}
            className="text-xs px-2.5 py-0.5 font-semibold"
          >
            {netWorth >= 0 ? 'Positive Wealth' : 'In Debt'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Net Worth Stat */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-3 border-b">
          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
            Total Net Worth
          </span>
          <div className="text-3xl font-extrabold text-foreground tabular-nums">
            ₹{netWorth.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Assets vs Liabilities Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Assets */}
          <div className="p-3 rounded-lg border bg-emerald-500/5 border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="size-3.5" /> Total Assets
              </span>
              <span className="text-sm font-bold text-foreground">
                ₹{totalAssets.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-[11px] space-y-1 pt-1 divide-y divide-border/40">
              {Object.entries(assetDistribution).map(([name, amt]) => (
                <div key={name} className="flex justify-between pt-1 text-muted-foreground">
                  <span className="truncate pr-2">{name}</span>
                  <span className="font-medium text-foreground">₹{amt.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Liabilities */}
          <div className="p-3 rounded-lg border bg-destructive/5 border-destructive/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-destructive flex items-center gap-1">
                <ArrowDownRight className="size-3.5" /> Total Liabilities
              </span>
              <span className="text-sm font-bold text-foreground">
                ₹{totalLiabilities.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-[11px] space-y-1 pt-1 divide-y divide-border/40">
              {Object.entries(liabilityDistribution).map(([name, amt]) => (
                <div key={name} className="flex justify-between pt-1 text-muted-foreground">
                  <span className="truncate pr-2">{name}</span>
                  <span className="font-medium text-foreground">₹{amt.toLocaleString('en-IN')}</span>
                </div>
              ))}
              {Object.keys(liabilityDistribution).length === 0 && (
                <div className="text-xs text-muted-foreground pt-1">No debt obligations recorded.</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
