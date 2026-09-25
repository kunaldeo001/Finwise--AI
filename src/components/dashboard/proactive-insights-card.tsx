'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, Lightbulb, ShieldCheck } from 'lucide-react';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import Link from 'next/link';

export function ProactiveInsightsCard() {
  const { proactiveInsights } = useFinwiseData();

  if (!proactiveInsights || proactiveInsights.length === 0) {
    return null;
  }

  const getSeverityBadge = (severity: 'info' | 'warning' | 'positive' | 'critical') => {
    switch (severity) {
      case 'critical':
      case 'warning':
        return (
          <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-[10px] gap-1 py-0.5">
            <AlertTriangle className="size-3" /> Needs Attention
          </Badge>
        );
      case 'positive':
        return (
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-[10px] gap-1 py-0.5">
            <CheckCircle2 className="size-3" /> On Track
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-accent border-accent/30 bg-accent/10 text-[10px] gap-1 py-0.5">
            <Lightbulb className="size-3" /> Proactive Insight
          </Badge>
        );
    }
  };

  return (
    <Card className="shadow-sm border border-accent/30 bg-gradient-to-br from-card via-card to-accent/5">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-accent/20 flex items-center justify-center text-accent">
              <Sparkles className="size-3.5" />
            </div>
            <CardTitle className="text-base font-semibold">AI Financial Insight Engine</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Continuous autonomous ledger surveillance with data-backed reasoning & suggested actions.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild className="text-xs h-7 gap-1 border-accent/40 text-accent">
          <Link href="/assistant">
            Deep-Dive Copilot <ArrowRight className="size-3" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {proactiveInsights.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl border border-border/80 bg-background/60 hover:bg-background/90 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {item.title}
                  </span>
                  {getSeverityBadge(item.severity)}
                </div>

                <p className="text-xs font-semibold text-foreground leading-snug">
                  {item.insight}
                </p>

                <div className="bg-muted/40 rounded-lg p-2 text-[11px] font-mono text-muted-foreground border border-border/40">
                  <span className="text-foreground font-semibold">Data: </span>
                  {item.supportingData}
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 space-y-1.5 text-[11px]">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Reason: </span>
                  {item.reason}
                </p>
                <p className="text-accent font-medium flex items-start gap-1">
                  <span className="font-semibold shrink-0">Action:</span>
                  <span>{item.suggestedAction}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
